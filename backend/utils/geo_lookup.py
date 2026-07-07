import socket
import urllib.request
import json

def get_hostname(ip):
    """Try reverse DNS lookup"""
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return hostname
    except (socket.herror, socket.gaierror):
        return None

def get_geo_location(ip):
    try:
        # Only skip TRUE private/reserved ranges
        if ip.startswith(("192.168.", "10.", "192.0.0.")):
            return {"city": "Private Network", "country": "Local", "isp": "Internal"}
        
        # Check 172.16.0.0 - 172.31.255.255 properly
        if ip.startswith("172."):
            second_octet = int(ip.split(".")[1])
            if 16 <= second_octet <= 31:
                return {"city": "Private Network", "country": "Local", "isp": "Internal"}

        url = f"http://ip-api.com/json/{ip}"
        with urllib.request.urlopen(url, timeout=2) as response:
            data = json.loads(response.read())
            if data.get("status") == "success":
                return {
                    "city": data.get("city", "Unknown"),
                    "country": data.get("country", "Unknown"),
                    "isp": data.get("isp", "Unknown")
                }
    except Exception:
        pass
    return {"city": "Unknown", "country": "Unknown", "isp": "Unknown"}