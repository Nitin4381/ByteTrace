import asyncio
import websockets
import json

async def test():
    async with websockets.connect('ws://127.0.0.1:8000/trace') as ws:
        # Send target with first command
        await ws.send(json.dumps({
            "command": "start_dns",
            "target": "google.com",
            "dns_mode": "recursive"
        }))
        
        while True:
            try:
                msg = await ws.recv()
                data = json.loads(msg)
                print(data)
                
                # Auto-trigger next probe when current one completes
                if data.get("step") == "dns_done":
                    await ws.send(json.dumps({"command": "start_ping"}))
                elif data.get("step") == "ping_done":
                    await ws.send(json.dumps({"command": "start_traceroute"}))
                elif data.get("step") == "traceroute_done":
                    await ws.send(json.dumps({"command": "start_portscan"}))
                elif data.get("step") == "portscan_done":
                    await ws.send(json.dumps({"command": "start_http"}))
                elif data.get("step") == "complete":
                    print("\nTrace complete!")
                    break
                    
            except websockets.exceptions.ConnectionClosedOK:
                break

asyncio.run(test())