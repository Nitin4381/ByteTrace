import socket
import struct
import asyncio


def build_dns_query(domain: str, recursion_desired: bool = False) -> bytes:
    ID = 0x1A2B
    FLAGS = 0x0100 if recursion_desired else 0x0000
    QDCOUNT = 1
    ANCOUNT = 0
    NSCOUNT = 0
    ARCOUNT = 0

    header = struct.pack('!HHHHHH', ID, FLAGS, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT)

    question = b''
    for part in domain.split('.'):
        question += bytes([len(part)]) + part.encode()
    question += b'\x00'
    question += struct.pack('!HH', 1, 1)

    return header + question


def query_dns_server(domain: str, server_ip: str, timeout=3):
    """Send a single DNS query to a specific server, return raw response"""
    query = build_dns_query(domain, recursion_desired=False)

    if ":" in server_ip:
        family = socket.AF_INET6
    else:
        family = socket.AF_INET

    sock = socket.socket(family, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        sock.sendto(query, (server_ip, 53))
        response, _ = sock.recvfrom(512)
        return response
    finally:
        sock.close()


def parse_name(data: bytes, offset: int):
    """
    Parses a DNS name starting at offset, handling compression pointers.
    Returns (name_string, new_offset_after_name)
    """
    labels = []
    jumped = False
    original_offset = offset

    while True:
        length = data[offset]

        if (length & 0xC0) == 0xC0:
            if not jumped:
                original_offset = offset + 2
            pointer = struct.unpack('!H', data[offset:offset+2])[0]
            offset = pointer & 0x3FFF
            jumped = True
            continue

        if length == 0:
            offset += 1
            break

        offset += 1
        labels.append(data[offset:offset+length].decode(errors='ignore'))
        offset += length

    name = '.'.join(labels)
    final_offset = original_offset if jumped else offset
    return name, final_offset


def parse_dns_response(response: bytes):
    """
    Parses a full DNS response.
    Returns dict with: answers, authority_ns, additional_ips
    """
    header = struct.unpack('!HHHHHH', response[:12])
    flags = header[1]
    qdcount = header[2]
    ancount = header[3]
    nscount = header[4]
    arcount = header[5]

    offset = 12

    for _ in range(qdcount):
        _, offset = parse_name(response, offset)
        offset += 4

    answers = []
    authority_ns = []
    additional_ips = {}

    for _ in range(ancount):
        name, offset = parse_name(response, offset)
        rtype, rclass, ttl, rdlength = struct.unpack('!HHIH', response[offset:offset+10])
        offset += 10
        if rtype == 1:
            ip_bytes = response[offset:offset+rdlength]
            ip = socket.inet_ntoa(ip_bytes)
            answers.append({"name": name, "ip": ip})
        offset += rdlength

    for _ in range(nscount):
        name, offset = parse_name(response, offset)
        rtype, rclass, ttl, rdlength = struct.unpack('!HHIH', response[offset:offset+10])
        offset += 10
        if rtype == 2:
            ns_name, _ = parse_name(response, offset)
            authority_ns.append(ns_name)
        offset += rdlength

    for _ in range(arcount):
        name, offset = parse_name(response, offset)
        rtype, rclass, ttl, rdlength = struct.unpack('!HHIH', response[offset:offset+10])
        offset += 10
        if rtype == 1:
            ip_bytes = response[offset:offset+rdlength]
            ip = socket.inet_ntoa(ip_bytes)
            additional_ips[name] = ip
        offset += rdlength

    return {
        "answers": answers,
        "authority_ns": authority_ns,
        "additional_ips": additional_ips,
        "has_answer": len(answers) > 0
    }


ROOT_SERVERS = [
    "198.41.0.4",
    "199.9.14.201",
    "192.33.4.12",
    "199.7.91.13",
]


async def resolve_dns_recursive(domain: str, websocket):
    await websocket.send_json({
        "step": "dns_start",
        "message": f"Starting iterative DNS resolution for {domain}"
    })

    current_servers = ROOT_SERVERS
    current_server_type = "Root"
    max_iterations = 10

    for iteration in range(max_iterations):
        server_ip = current_servers[0]

        await websocket.send_json({
            "step": "dns_querying",
            "message": f"Asking {current_server_type} server ({server_ip}): who handles {domain}?",
            "server_type": current_server_type,
            "server_ip": server_ip
        })

        try:
            response = query_dns_server(domain, server_ip)
        except (socket.timeout, OSError):
            await websocket.send_json({
                "step": "dns_error",
                "message": f"No response from {server_ip}, trying next server"
            })
            current_servers = current_servers[1:]
            if not current_servers:
                await websocket.send_json({
                    "step": "dns_failed",
                    "message": "All servers failed to respond"
                })
                return
            continue

        parsed = parse_dns_response(response)

        if parsed["has_answer"]:
            final_ip = parsed["answers"][0]["ip"]
            await websocket.send_json({
                "step": "dns_resolved",
                "message": f"Final answer received from {current_server_type} server",
                "ip": final_ip,
                "domain": domain,
                "total_hops": iteration + 1
            })
            return final_ip

        if parsed["authority_ns"]:
            next_servers = []
            for ns_name in parsed["authority_ns"]:
                if ns_name in parsed["additional_ips"]:
                    next_servers.append(parsed["additional_ips"][ns_name])

            if not next_servers:
                await websocket.send_json({
                    "step": "dns_error",
                    "message": "No glue records found, cannot continue"
                })
                return

            await websocket.send_json({
                "step": "dns_referral",
                "message": f"{current_server_type} server referred us to: {', '.join(parsed['authority_ns'][:2])}",
                "nameservers": parsed["authority_ns"],
                "next_ips": next_servers
            })

            current_servers = next_servers
            current_server_type = "TLD" if current_server_type == "Root" else "Authoritative"
        else:
            await websocket.send_json({
                "step": "dns_failed",
                "message": "No answer and no referral — resolution failed"
            })
            return

    await websocket.send_json({
        "step": "dns_failed",
        "message": "Max iterations reached without resolution"
    })