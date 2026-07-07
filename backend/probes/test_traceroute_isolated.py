import socket
import struct
import time
import select

def calculate_checksum(data):
    total = 0
    for i in range(0, len(data), 2):
        if i + 1 < len(data):
            word = (data[i] << 8) + data[i + 1]
        else:
            word = data[i] << 8
        total += word
    while total >> 16:
        total = (total & 0xFFFF) + (total >> 16)
    return ~total & 0xFFFF

def build_packet(seq):
    header = struct.pack('!BBHHH', 8, 0, 0, 1, seq)
    data = b'ByteTrace'
    checksum = calculate_checksum(header + data)
    header = struct.pack('!BBHHH', 8, 0, checksum, 1, seq)
    return header + data

def parse_icmp_type(raw_packet):
    # IP header length is variable - read IHL from first byte
    ihl = (raw_packet[0] & 0x0F) * 4
    icmp_type = raw_packet[ihl]
    icmp_code = raw_packet[ihl + 1]
    return icmp_type, icmp_code

ip = "8.8.8.8"

# Create ONE socket for entire traceroute
sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
sock.bind(("0.0.0.0", 0))

for ttl in range(1, 14):
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_TTL, ttl)
    
    packet = build_packet(ttl)
    start = time.time()
    sock.sendto(packet, (ip, 0))
    
    # Use select() for precise, immediate readiness checking
    ready = select.select([sock], [], [], 2)
    
    if ready[0]:
        response, addr = sock.recvfrom(1024)
        end = time.time()
        rtt = round((end - start) * 1000, 2)
        icmp_type, icmp_code = parse_icmp_type(response)
        
        type_name = {0: "Echo Reply", 11: "Time Exceeded", 3: "Dest Unreachable"}.get(icmp_type, f"Type {icmp_type}")
        print(f"TTL={ttl}: {addr[0]} — {rtt}ms — {type_name}")
    else:
        print(f"TTL={ttl}: * (timeout)")

sock.close()