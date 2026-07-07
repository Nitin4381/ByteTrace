
import socket
import asyncio
#Common ports with their service names

COMMON_PORTS ={
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    3306: "MySQL",
    5432: "PostgreSQL",
    6379: "Redis",
    8080: "HTTP-Alt",
    8443: "HTTP-Alt",
    27017:"MongoDB"

}

async def port_scan(host: str, websocket):
    await websocket.send_json({
        "step":"portscan_start",
        "message":f"Starting port scan for{host}"
    })

    ip=socket.gethostbyname(host)
    await websocket.send_json({
        "step":"portscan_resolved",
        "message":f"Scanning {host} ({ip})",
        "ip":ip

    })

    open_ports=[]
    
    for port , service in COMMON_PORTS.items():
        sock=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
        sock.settimeout(2.0)

        await websocket.send_json({
            "step":"portscan_trying",
            "message":f"Trying port {port} ({service})",
            "port":port,
            "service":service
        })

        result=sock.connect_ex((ip,port))

        if result==0:
            status="open"
        else :
            status="closed"

        await websocket.send_json({
            "step":"portscan_result",
            "message":f"Port {port} ({service}) is {status.upper()}",
            "port":port,
            "service":service,
            "status":status
        })        

        if result==0:
            open_ports.append({"port":port,"service":service})

        sock.close()

    await websocket.send_json({
        "step":"portscan_complete",
        "message":f"Scan Complete - {len(open_ports)} open ports found",
        "open_ports":open_ports
    })        