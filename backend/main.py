"""
ByteTrace Backend Engine
------------------------
FastAPI server providing real-time network protocol tracing via WebSockets.
Executes raw socket probes (DNS, ICMP Ping, Traceroute, TCP Port Scan, HTTP/1.0)
and streams live step-by-step packet details back to the React frontend.
"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from probes.dns import resolve_dns
from probes.dns_recursive import resolve_dns_recursive 
from probes.ping import ping
from probes.traceroute import  traceroute
from probes.port_scanner import port_scan
from probes.http_client import http_probe

app=FastAPI(title="ByteTrace",version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message":"ByteTrace Engine Running"}

@app.websocket("/trace")
async def trace(websocket: WebSocket):
    await websocket.accept()
    
    target = None  # store once, reuse for all commands
    dns_mode = "recursive"

    try:
        while True:
            data = await websocket.receive_json()
            command = data.get("command")
            
            # Update target only if provided
            if data.get("target"):
                target = data.get("target")
                dns_mode = data.get("dns_mode", "recursive")

            if not target:
                await websocket.send_json({
                    "step": "error",
                    "message": "No target provided"
                })
                continue

            try:
                if command == "start_dns":
                    await websocket.send_json({
                        "step": "started",
                        "message": f"Starting trace for {target}"
                    })
                    if dns_mode == "recursive":
                        await resolve_dns_recursive(target, websocket)
                    else:
                        await resolve_dns(target, websocket)
                    await websocket.send_json({"step": "dns_done"})

                elif command == "start_ping":
                    await ping(target, websocket)
                    await websocket.send_json({"step": "ping_done"})

                elif command == "start_traceroute":
                    await traceroute(target, websocket)
                    await websocket.send_json({"step": "traceroute_done"})

                elif command == "start_portscan":
                    await port_scan(target, websocket)
                    await websocket.send_json({"step": "portscan_done"})

                elif command == "start_http":
                    await http_probe(target, websocket)
                    await websocket.send_json({"step": "http_done"})
                    await websocket.send_json({
                        "step": "complete",
                        "message": "Trace complete"
                    })
                elif command=="disconnect":
                    await websocket.close()
            except Exception as cmd_err:
                print(f"Error executing {command} for {target}: {cmd_err}")
                step_name = f"{command.replace('start_', '')}_error" if command and command.startswith("start_") else "error"
                await websocket.send_json({
                    "step": step_name,
                    "message": f"Error: {str(cmd_err)}"
                })
                done_name = f"{command.replace('start_', '')}_done" if command and command.startswith("start_") else "error_done"
                await websocket.send_json({"step": done_name})
                await websocket.send_json({
                    "step": "disconnect",
                    "message": "Connection closed"
                })
    except Exception as e:
        print(f"WebSocket closed or error: {e}")