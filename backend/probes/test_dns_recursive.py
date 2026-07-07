import asyncio
import sys

# Mock websocket object that just prints instead of sending over network
class MockWebSocket:
    async def send_json(self, data):
        print(data)

async def main():
    domain = sys.argv[1] if len(sys.argv) > 1 else "google.com"
    ws = MockWebSocket()
    
    # Import functions from your dns_recursive.py file
    from dns_recursive import resolve_dns_recursive
    
    result = await resolve_dns_recursive(domain, ws)
    print(f"\nFINAL RESULT: {result}")

asyncio.run(main())