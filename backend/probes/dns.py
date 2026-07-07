import socket
import struct
import asyncio

def build_dns_query(domain: str) -> bytes:
    # DNS Header
    ID = 0x1A2B
    FLAGS = 0x0100
    QDCOUNT = 1
    ANCOUNT = 0
    NSCOUNT = 0
    ARCOUNT = 0

    header = struct.pack(
        '!HHHHHH',
        ID, FLAGS, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT
    )

    # DNS Question
    question = b''
    for part in domain.split('.'):
        question += bytes([len(part)]) + part.encode()
    question += b'\x00'
    question += struct.pack('!HH', 1, 1)

    return header + question


async def resolve_dns(domain: str, websocket):
    await websocket.send_json({
        "step": "dns_start",
        "message": f"Starting DNS Resolution for {domain}"
    })

    query = build_dns_query(domain)
    await websocket.send_json({
        "step": "dns_packet_built",
        "message": "DNS query packet built",
        "bytes": query.hex()
    })

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(3)

    await websocket.send_json({
        "step": "dns_sending",
        "message": "Sending UDP packet to 8.8.8.8:53"
    })

    try:
        sock.sendto(query, ("8.8.8.8", 53))

        response, _ = sock.recvfrom(512)
        await websocket.send_json({
            "step": "dns_response",
            "message": "Response Received",
            "bytes": response.hex()
        })

        rdlength = struct.unpack('!H', response[-6:-4])[0]
        ip_bytes = response[-rdlength:]

        if rdlength == 4:
            ip = socket.inet_ntoa(ip_bytes)
            ip_version = "IPv4"
        elif rdlength == 16:
            ip = socket.inet_ntop(socket.AF_INET6, ip_bytes)
            ip_version = "IPv6"
        else:
            ip = "Unknown"
            ip_version = "Unknown"

        await websocket.send_json({
            "step": "dns_resolved",
            "message": "Domain resolved successfully",
            "ip": ip,
            "domain": domain
        })

    except socket.timeout:
        await websocket.send_json({
            "step": "dns_error",
            "message": "DNS query timed out - no response from 8.8.8.8:53"
        })
    except Exception as e:
        await websocket.send_json({
            "step": "dns_error",
            "message": f"Error: {str(e)}"
        })
    finally:
        sock.close()

    await websocket.send_json({
        "step": "dns_complete",
        "message": "DNS resolution complete"
    })