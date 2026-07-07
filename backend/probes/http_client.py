import socket
import asyncio
from utils.packet_builder import create_raw_socket
async def http_probe(host:str,websocket):
    await websocket.send_json({
        "step":"http_start",
        "message":f"Starting HTTP probe for {host}"
    })

    #Reuse existing IP detection logic

    raw_sock,ip,ip_version,_=create_raw_socket(host)
    raw_sock.close() #we do not need raw socket just ip info


    ip=socket.gethostbyname(host)
    await websocket.send_json({
        "step":"http_resolved",
        "message":f"Resolved {host} to {ip}",
        "ip":ip,
        "ip_version":"IPv4" if ip_version==socket.AF_INET else "IPv6"
    })

    # Creating proper TCP socket using same family
    sock=socket.socket(ip_version,socket.SOCK_STREAM)
    sock.settimeout(5)

    await websocket.send_json({
        "step":"http_connecting",
        "message":f"Connecting to {ip}:80 "

    })

    try:
        sock.connect((ip,80))

        await websocket.send_json({
            "step":"http_connected",
            "message":"TCP connection established"
        })

        request=f"GET / HTTP/1.0\r\nHost: {host}\r\n\r\n"

        await websocket.send_json({
            "step":"http_sending",
            "message":"Sending HTTP GET request",
            "request": request
        })

        sock.send(request.encode())

        response=b''
        while True:
            chunck=sock.recv(4096)
            if not chunck:
                break
            response+=chunck
        
        decoded=response.decode(errors='ignore')

        if '\r\n\r\n' in decoded:
            headers, body =decoded.split('\r\n\r\n',1)
        else:
            headers=decoded
            body=''
        
        status_line =headers.split('\r\n')[0]

        await websocket.send_json({
            "step":"http_response",
            "message":"Response received",
            "status_line":status_line,
            "headers":headers[:1000],
            "body_preview": body[:500],
            "total_bytes":len(response)
        })

        await websocket.send_json({
            "step":"http_complete",
            "message":"HTTP probe complete"
        })

    except socket.timeout:
            await websocket.send_json({
                "step":"http_error",
                "message":"Connection timed out"
            })

    except Exception as e:
        await websocket.send_json({
                "step":"http_error",
                "message":f"Error: {str(e)}"
            })
    finally:
        sock.close()


