import socket
import struct
import time
import asyncio
from utils.packet_builder import create_raw_socket

def calculate_checksum(data: bytes) ->int:
    total=0
    ##Add 16 bit words together
    for i in range(0,len(data),2):   #Loop for calculating checksum
        if i+1 <len(data):      
            word=(data[i]<<8)+data[i+1]

        else:
            word=data[i]<<8
        total+=word

     #Fold 32 bit sum to 16 bits
    while total >> 16:                       #If data is grater than 16 bit then it adds the larges bit to the lowest bit and do the calculation
        total=(total & 0xFFFF)+ (total>>16)

       #1's complement
    return  ~total &0xFFFF   #do 1's complement and return 16 bit only

def build_icmp_packet() -> bytes:
    #ICMPHeader fields
    TYPE=8                 #Every ICMP packet starts with Type fiels if it is 8 it means it ie ECHO request if it is 0 means Echo reply
    CODE=0
    CHECKSUM=0
    ID=1
    SEQUENCE=1

    #Pack without checksum first

    header =struct.pack('!BBHHH',TYPE,CODE,CHECKSUM,ID,SEQUENCE)  #This convert header into bytes  and total header size if 8 bytes
    data=b'ByteTrace'

    #Calculate checksum

    CHECKSUM=calculate_checksum(header+data)

    #Repack with correct checksum  by replacinf CHECKSUM
    header =struct.pack('!BBHHH',TYPE,CODE,CHECKSUM,ID,SEQUENCE)  

    return header+data


async def ping(host:str,websocket):
    await websocket.send_json({
        "step":"ping_start",
        "message":f"Starting ping for {host}"
    })

    sock = None
    try:
        # Resolve host to IP first
        ip=socket.gethostbyname(host)
        await websocket.send_json({
            "step":"ping_resolved",
            "message":f"Resolved {host} to {ip}"
        })

        # Build ICMP Packet
        packet=build_icmp_packet()
        await websocket.send_json({
            "step":"ping_packet_built",
            "message":"ICMP echo request packet built",
            "bytes": packet.hex()
        })
        
        print(f"Attempting create_raw_socket for {host}")  # ← add this
        sock, ip, ip_version, ttl_option = create_raw_socket(host)
        print(f"Socket created: {sock}")  # ← add this
        sock.settimeout(3)

        await websocket.send_json({
            "step": "ping_socket",
            "message": f"Created {'IPv4' if ip_version == socket.AF_INET else 'IPv6'} raw socket",
            "ip": ip
        })

        start = time.time()
        sock.sendto(packet, (ip, 0))

        response, _ = sock.recvfrom(1024)
        end = time.time()
        rtt = round((end - start) * 1000, 2)

        await websocket.send_json({
            "step":"ping_response",
            "message":f"Response Received",
            "bytes":response.hex(),
            "rtt_ms":rtt
        })

        await websocket.send_json({
            "step":"ping_complete",
            "message":f"Ping Succeful- {rtt}ms"
        })

    except socket.timeout:
        await websocket.send_json({
            "step":"ping_error",
            "message":"Ping timed out"
        }) 
    except PermissionError:
        await websocket.send_json({
            "step":"ping_error",
            "message":"Permission denied- run as administrator"
        })  
    except Exception as e:
        await websocket.send_json({
            "step":"ping_error",
            "message":f"Error: {str(e)}"
        })
    finally:
        if sock:
             sock.close()