import socket
def create_raw_socket(host: str):

    print(f"create_raw_socket called for {host}")  # ← add this
    try:
        socket.getaddrinfo(host, None, socket.AF_INET)
        ip = socket.gethostbyname(host)
        ip_version = socket.AF_INET
        protocol = socket.IPPROTO_ICMP
        ttl_option = (socket.IPPROTO_IP, socket.IP_TTL)
        print(f"IPv4 detected, ip={ip}")  # ← add this
    except socket.gaierror:
        print("IPv4 failed, trying IPv6")  # ← add this
        ip_version = socket.AF_INET6
        protocol = socket.IPPROTO_ICMPV6
        addr_info = socket.getaddrinfo(host, None, socket.AF_INET6)
        ip = addr_info[0][4][0]
        ttl_option = (socket.IPPROTO_IPV6, socket.IPV6_UNICAST_HOPS)

    print(f"Creating socket...")  # ← add this
    sock = socket.socket(ip_version, socket.SOCK_RAW, protocol)
    sock.bind(("0.0.0.0", 0))
    print(f"Socket created successfully")  # ← add this
    return sock, ip, ip_version, ttl_option