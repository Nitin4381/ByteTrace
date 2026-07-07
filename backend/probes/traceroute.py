import socket
import time
import select
import asyncio
from probes.ping import build_icmp_packet
from utils.packet_builder import create_raw_socket
from utils.geo_lookup import get_hostname, get_geo_location

def parse_icmp_type(raw_packet):
    # ICMP type field is at the end of the IP header (IHL * 4)
    ihl = (raw_packet[0] & 0x0F) * 4
    icmp_type = raw_packet[ihl]
    return icmp_type

async def traceroute(host: str, websocket):
    await websocket.send_json({"step": "traceroute_start", "message": f"Starting traceroute for {host}"})

    # Initial setup
    _, ip, ip_version, _ = create_raw_socket(host)

    await websocket.send_json({
        "step": "traceroute_resolved",
        "message": f"Target IP: {ip}",
        "ip": ip,
        "ip_version": "IPv4" if ip_version == socket.AF_INET else "IPv6"
    })

    max_hops = 30
    timeout = 1.0  # seconds

    # Use ONE raw socket for the entire traceroute
    sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
    sock.bind(("0.0.0.0", 0))

    for ttl in range(1, max_hops + 1):
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_TTL, ttl)
        if (ttl > 10):
            timeout = 2.0

        await websocket.send_json({"step": "traceroute_sending", "message": f"Sending packet with TTL={ttl}", "ttl": ttl})

        packet = build_icmp_packet()
        start = time.time()
        sock.sendto(packet, (ip, 0))

        # Use select() for precise, non-blocking timeout handling
        # select.select(inputs, outputs, errors, timeout)
        ready_to_read, _, _ = select.select([sock], [], [], timeout)

        if ready_to_read:
            response, addr = sock.recvfrom(1024)
            end = time.time()
            rtt = round((end - start) * 1000, 2)
            hop_ip = addr[0]
            icmp_type = parse_icmp_type(response)

            # GeoIP + reverse DNS lookup for this hop
            hostname = get_hostname(hop_ip)
            geo = get_geo_location(hop_ip)

            await websocket.send_json({
                "step": "traceroute_hop",
                "message": f"Hop {ttl}: {hop_ip} — {rtt}ms",
                "ttl": ttl,
                "hop_ip": hop_ip,
                "rtt_ms": rtt,
                "icmp_type": icmp_type,
                "hostname": hostname,
                "city": geo["city"],
                "country": geo["country"],
                "isp": geo.get("isp", "")
            })

            # 0 is Echo Reply (Target reached), 11 is Time Exceeded (Router in path)
            if hop_ip == ip or icmp_type == 0:
                await websocket.send_json({
                    "step": "traceroute_complete",
                    "message": f"Reached {host} in {ttl} hops",
                    "total_hops": ttl
                })
                break
        else:
            # Timeout case handled cleanly
            await websocket.send_json({
                "step": "traceroute_hop",
                "message": f"Hop {ttl}: * (timeout)",
                "ttl": ttl,
                "hop_ip": "*",
                "rtt_ms": None
            })

    sock.close()