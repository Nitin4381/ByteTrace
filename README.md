# ByteTrace 🔍

> **Watch the internet work — at the byte level.**

ByteTrace is an open source network diagnostics engine that traces every protocol your computer uses — DNS, ICMP, TCP, HTTP — built entirely from raw Python sockets with zero networking libraries, and visualized live in a React dashboard via WebSockets.

🎬 **[Click Here to Download & Watch the Full Demo Video (demo.mp4)](https://github.com/Nitin4381/ByteTrace/raw/main/demo.mp4)**  
*(High-resolution 21MB walkthrough of the live protocol visualizer in action)*

---

## What Makes ByteTrace Different

Most network tools show you **results**. ByteTrace shows you the **journey**.

| Tool | What it shows |
|------|--------------|
| `nslookup` | Final IP address only |
| `ping` | Round trip time only |
| `tracert` | Hop list only |
| **ByteTrace** | Every byte, every protocol, every hop — live and animated |

---

## Architecture & System Workflow

ByteTrace uses a **Hybrid Execution Architecture** to overcome OS restrictions: the Python backend runs directly on the Windows Host (to gain Administrator privileges for raw sockets and avoid Hyper-V port conflicts), while the React frontend is served cleanly via Docker and Nginx.

```mermaid
graph TD
    subgraph Frontend [ 🖥️ FRONTEND DASHBOARD — Docker Container / Port 3000 ]
        UI("🎨 React 19 + Framer Motion UI")
        Nginx("⚡ Nginx Web Server")
        UI <-->|"Served by"| Nginx
    end

    subgraph Backend [ ⚙️ BACKEND ENGINE — Windows Host / Port 8888 / Admin Privileges ]
        FastAPI("🚀 FastAPI WebSocket Server")
        Router("🔀 Protocol Dispatcher")
        FastAPI ==> Router
    end

    %% Force strict vertical alignment: Frontend directly above Backend
    UI ===|"⚡ Live WebSocket Stream (JSON Event Frames)"|==> FastAPI

    subgraph RawSockets [ 🔌 RAW SOCKETS ENGINE — Zero Networking Libraries ]
        DNS("🌐 Recursive DNS Resolver (UDP Port 53)")
        ICMP("📡 ICMP Ping & Traceroute (IP TTL Hops)")
        TCP("🔍 TCP Connect Port Scanner (3-Way Handshake)")
        HTTP("📄 Raw HTTP/1.0 Client (Manual Header Parsing)")
    end

    Router ==> DNS
    Router ==> ICMP
    Router ==> TCP
    Router ==> HTTP

    subgraph Internet [ 🌍 EXTERNAL INTERNET & TARGETS ]
        Root("🌳 Root & TLD Nameservers (.com)")
        Hops("🌐 Hop-by-Hop Internet Routers & GeoIP")
        Targets("🎯 Target Servers (Ports 80, 443, 22)")
    end

    DNS <-->|"Query / Response"| Root
    ICMP <-->|"Echo Request / Time Exceeded"| Hops
    TCP <-->|"SYN / SYN-ACK / ACK"| Targets
    HTTP <-->|"Raw GET Request / Response Stream"| Targets

    %% Solid subgraph styling with curved edges (no dashed boxes)
    style Frontend fill:#0d1117,stroke:#38bdf8,stroke-width:3px,color:#38bdf8,rx:15,ry:15
    style Backend fill:#161b22,stroke:#a855f7,stroke-width:3px,color:#d8b4fe,rx:15,ry:15
    style RawSockets fill:#0b1914,stroke:#10b981,stroke-width:3px,color:#6ee7b7,rx:15,ry:15
    style Internet fill:#1f130b,stroke:#f59e0b,stroke-width:3px,color:#fde68a,rx:15,ry:15

    %% Node styling with rounded edges and vibrant colors
    classDef frontNode fill:#0369a1,stroke:#38bdf8,stroke-width:3px,color:#ffffff,font-size:15px,font-weight:bold,rx:20,ry:20;
    classDef backNode fill:#6b21a8,stroke:#c084fc,stroke-width:3px,color:#ffffff,font-size:15px,font-weight:bold,rx:20,ry:20;
    classDef socketNode fill:#047857,stroke:#34d399,stroke-width:3px,color:#ffffff,font-size:15px,font-weight:bold,rx:20,ry:20;
    classDef netNode fill:#b45309,stroke:#fbbf24,stroke-width:3px,color:#ffffff,font-size:15px,font-weight:bold,rx:20,ry:20;

    class UI,Nginx frontNode;
    class FastAPI,Router backNode;
    class DNS,ICMP,TCP,HTTP socketNode;
    class Root,Hops,Targets netNode;
```

---

## Features

- **Recursive DNS Resolver** — traces the full DNS hierarchy: Root Servers → TLD Servers → Authoritative Servers, built from raw UDP sockets
- **Simple DNS Resolver** — direct resolution via 8.8.8.8, for comparison
- **ICMP Ping** — crafts echo request packets manually with checksum calculation from scratch
- **Traceroute** — TTL manipulation with real-time GeoIP + reverse DNS per hop
- **Port Scanner** — TCP connect scanning across 15 common ports
- **HTTP Client** — raw TCP socket with manual HTTP/1.0 request/response parsing
- **Live Visualizer** — every step streamed via WebSocket to an animated React dashboard
- **Step-by-Step Mode** — user controls each probe individually for educational pacing
- **Containerized Architecture** — Docker & Nginx ready for seamless deployment

---

## Demo

🎬 **[Click Here to Download & Watch the Full Demo Video (demo.mp4)](https://github.com/Nitin4381/ByteTrace/raw/main/demo.mp4)**  
*(High-resolution 21MB walkthrough of the live protocol visualizer in action)*

---

## Tech Stack

### Backend
- **Python 3.11+** — raw `socket` module only (zero networking libraries)
- **FastAPI** — WebSocket API server & CORS middleware
- **struct** — manual binary packet building & parsing
- **GeoIP** — ip-api.com free API integration
- **Reverse DNS** — `socket.gethostbyaddr()`

### Frontend
- **React 19** — modern component-based UI
- **Framer Motion** — fluid micro-animations & state transitions
- **WebSocket API** — real-time event streaming & interactive pipeline

---

## Architecture

```
User (Browser @ http://localhost:3000)
      ↕  WebSocket (ws://localhost:8888/trace or 8000)
FastAPI Backend Engine (main.py)
      ↕  Raw Python Sockets (ICMP, UDP, TCP)
Internet Infrastructure
   ├── DNS Root Servers (198.41.0.4...)
   ├── TLD Servers (.com, .net, .org)
   ├── Authoritative Nameservers
   ├── ICMP Targets (Ping + Traceroute)
   └── TCP Services (Port Scanner + HTTP)
```

---

## Practical Setup Guide

### 1. Hybrid Setup (Recommended for Windows Developers)
Because ByteTrace executes raw sockets (ICMP pings, custom traceroute UDP/ICMP packets), running the backend natively as Administrator on Windows avoids virtual machine network restrictions, while Docker handles clean frontend delivery via Nginx.

**Step A: Start the Backend Natively (as Administrator)**
Open PowerShell or Terminal **as Administrator** (required for raw sockets):
```powershell
# Clone the repository
git clone https://github.com/yourusername/ByteTrace.git
cd ByteTrace/backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server on port 8888 (avoids Windows Hyper-V port 8000 locks)
uvicorn main:app --reload --port 8888
```

**Step B: Start the Frontend in Docker**
Open a second terminal and start the Nginx-served frontend:
```powershell
cd ByteTrace
docker compose up -d --build frontend
```
👉 Open your browser at **http://localhost:3000** — your containerized React UI will connect directly to your native Python socket engine!

---

### 2. Full Docker Setup (One-Command Deployment)
If running on Linux or macOS (where Docker natively supports `cap_add: NET_RAW, NET_ADMIN`), you can launch the entire full-stack application in containers:

```bash
git clone https://github.com/yourusername/ByteTrace.git
cd ByteTrace
docker compose up -d --build
```
* Frontend Dashboard: `http://localhost:3000`
* Backend API: `http://localhost:9000`

---

### 3. Pure Local Development Setup
To run both services natively without Docker:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8888
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```
Frontend development server opens at `http://localhost:3000`.

---

## Windows Firewall Rules (Required for Traceroute)

ByteTrace uses raw ICMP sockets for traceroute. Windows Firewall blocks incoming ICMP Time Exceeded messages by default. Run these commands in **PowerShell as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "ByteTrace ICMP" -Protocol ICMPv4 -IcmpType 11 -Direction Inbound -Action Allow
New-NetFirewallRule -DisplayName "ByteTrace ICMP Unreachable" -Protocol ICMPv4 -IcmpType 3 -Direction Inbound -Action Allow
```

To remove the rules after testing:
```powershell
Remove-NetFirewallRule -DisplayName "ByteTrace ICMP"
Remove-NetFirewallRule -DisplayName "ByteTrace ICMP Unreachable"
```

---

## How It Works Under The Hood

### DNS Resolution (Two Modes)

**Simple Mode** — sends a single UDP query to `8.8.8.8` (Google's DNS). Fast, one hop, shows the final answer.

**Recursive Mode** — implements the full iterative DNS resolution algorithm from scratch:
1. Queries one of the 13 hardcoded root servers (`198.41.0.4`)
2. Root server returns a referral to the TLD nameservers (`.com`, `.net`, etc.)
3. TLD server returns a referral to the domain's authoritative nameservers
4. Authoritative server returns the final IP address

Zero DNS libraries. Every packet built manually using `struct.pack()`.

### Ping (ICMP)

Manually builds an ICMP echo request packet:
- Sets `Type=8` (echo request), `Code=0`
- Calculates checksum using one's complement arithmetic from scratch
- Sends via `SOCK_RAW` socket
- Receives echo reply and measures exact round-trip latency

### Traceroute

Sets the IP Time-To-Live (`TTL`) field to 1, then 2, then 3... incrementally:
- Each intermediate router decrements TTL by 1
- When TTL reaches 0, router discards packet and sends back ICMP Type 11 (Time Exceeded)
- ByteTrace records that router's IP & measures RTT
- GeoIP lookup identifies physical location (City, Country, ISP) of each hop
- Reverse DNS lookup resolves the router hostname

### Port Scanner

For each port in the target list, attempts a full TCP `connect()`:
- `connect_ex()` returns `0` if port is open (TCP 3-way handshake succeeded)
- Non-zero means port is closed or filtered by a firewall

### HTTP Client

Opens a raw TCP socket to port 80, then:
1. Formats and sends raw HTTP/1.0 GET request string (`GET / HTTP/1.0\r\nHost: ...\r\n\r\n`)
2. Receives response in chunks via `recv(4096)` loop
3. Splits response on `\r\n\r\n` to separate headers from HTML body
4. Parses status line and individual HTTP headers

---

## Project Structure

```
ByteTrace/
├── backend/
│   ├── main.py                  # FastAPI app + WebSocket handler
│   ├── requirements.txt         # Python dependencies
│   ├── DockerFile               # Container build with NET_RAW capabilities
│   ├── probes/
│   │   ├── dns.py               # Simple DNS resolver (8.8.8.8)
│   │   ├── dns_recursive.py     # Full iterative DNS resolver
│   │   ├── ping.py              # Raw ICMP ping probe
│   │   ├── traceroute.py        # TTL-based traceroute + GeoIP
│   │   ├── port_scanner.py      # TCP port scanner
│   │   └── http_client.py       # Raw HTTP/1.0 client
│   └── utils/
│       ├── packet_builder.py    # Socket creation & IP detection
│       └── geo_lookup.py        # GeoIP + reverse DNS lookup
├── frontend/
│   ├── DockerFile               # Multi-stage Docker build (Node -> Nginx)
│   ├── nginx.conf               # Nginx server routing & static asset serving
│   ├── package.json             # React 19 & Framer Motion dependencies
│   ├── public/                  # Static web icons & manifest
│   └── src/
│       ├── App.jsx              # Main wizard UI & real-time WebSocket client
│       ├── App.css              # Custom responsive design system & animations
│       └── components/          # Protocol stage cards & interactive tiles
│           ├── DnsSection.jsx
│           ├── PingSection.jsx
│           ├── TracerouteSection.jsx
│           ├── PortScanSection.jsx
│           ├── HttpSection.jsx
│           └── OverviewSection.jsx
├── docker-compose.yaml          # Full-stack container orchestration
└── README.md
```

---

## API Reference

### WebSocket Endpoint: `ws://localhost:8888/trace` (or `:8000`)

**Commands sent by Frontend:**
```json
{ "command": "start_dns", "target": "google.com", "dns_mode": "recursive" }
{ "command": "start_ping" }
{ "command": "start_traceroute" }
{ "command": "start_portscan" }
{ "command": "start_http" }
{ "command": "disconnect" }
```

**Live Events streamed by Backend:**
```json
{ "step": "dns_querying", "server_type": "Root", "server_ip": "198.41.0.4" }
{ "step": "dns_referral", "nameservers": [...], "next_ips": [...] }
{ "step": "dns_resolved", "ip": "142.250.182.110", "domain": "google.com" }
{ "step": "ping_response", "rtt_ms": 45.2, "bytes": "4500..." }
{ "step": "traceroute_hop", "ttl": 5, "hop_ip": "103.x.x.x", "rtt_ms": 12.3, "city": "Mumbai", "country": "India" }
{ "step": "portscan_result", "port": 80, "service": "HTTP", "status": "open" }
{ "step": "http_response", "status_line": "HTTP/1.0 301 Moved Permanently", "headers": "..." }
```

---

## Surprising Findings ByteTrace Reveals

Running ByteTrace on popular domains exposes real-world internet architecture:

```
github.com   → Uses Amazon's DNS (awsdns) despite being owned by Microsoft
               Routes through Microsoft's Azure network (MSN backbone)
               Port 22 open — SSH for git push/pull operations

cloudflare.com → Resolves in just 3-5 hops (Cloudflare anycast is everywhere)
                 Extremely low latency (~10ms from most global locations)

8.8.8.8      → Google's public resolver
               Port 53 open (DNS) + 443 open (DNS over HTTPS)
```

---

## Roadmap

- [x] **Docker Deployment** — containerized frontend (Nginx) & backend engine
- [ ] **TLS/SSL Handshake Visualizer** — inspect certificates & cipher suites
- [ ] **GeoIP World Map** — interactive map visualization for traceroute hops
- [ ] **HTTP/2 & HTTP/3 Support** — modern protocol inspection
- [ ] **Full IPv6 Support** — dual-stack tracing across all probes
- [ ] **Packet Capture Export** — download session as `.pcap` or JSON report
- [ ] **Async GeoIP Lookups** — parallelize traceroute geolocation for speed

---

## Contributing

ByteTrace is built as an educational tool — every function is cleanly structured and documented to help developers understand networking protocols from first principles.

```bash
# Fork the repository & create a feature branch
git checkout -b feature/amazing-feature
git commit -m "Add: detailed feature description"
git push origin feature/amazing-feature
# Open a Pull Request on GitHub
```

**Where contributions are most welcome:**
- Additional protocol probes (SMTP, FTP, NTP, DNS over HTTPS)
- Performance optimizations & async socket handling
- UI micro-animations, charts, and responsive layout improvements
- Bug fixes & cross-platform socket compatibility

---

## Built By

**Nitin Dwivedi** — B.Tech Computer Science Student

Built for the **Elite Coders Open Source Hackathon 2026**

> *"I built DNS resolution, ICMP ping, traceroute, TCP port scanning, and an HTTP client — all from raw Python sockets with zero networking libraries — and streamed every byte live to a React dashboard."*

---

## License

MIT License — free to use, modify, and distribute. See `LICENSE` for details.

---

<div align="center">
  <strong>ByteTrace — Making the invisible internet visible</strong>
</div>