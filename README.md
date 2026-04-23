# Home Topology Mapper

Home Topology Mapper is a lightweight homelab network topology app for PVE/LXC and home LAN environments.

It is not an enterprise NMS. The goal is:

- discover LAN devices automatically
- infer basic device metadata
- generate a first topology draft
- let users drag nodes and manually confirm links
- preserve confirmed topology while future scans update status and add new devices

## Quick Start

```bash
git clone https://github.com/your-name/home-topology-mapper.git
cd home-topology-mapper
cp .env.example .env
# Edit HTM_SCAN_SUBNETS in .env, for example: HTM_SCAN_SUBNETS=10.0.0.0/24
docker compose up -d --build
```

Open:

```text
http://<your-lxc-ip>:8080
```

For best discovery accuracy in a Debian/Ubuntu LXC, run the container with host networking and `NET_RAW`.
The default `docker-compose.yml` already does this.

## MVP Features

- Subnet scan through `nmap`
- Device inventory with IP, MAC, hostname, vendor, type guess, online/offline state
- Topology editor powered by React Flow
- Node dragging and manual edge creation
- Save and restore topology layout
- Incremental scans preserve manual topology
- New devices are highlighted
- Offline devices are dimmed

## Development

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server expects the API at `http://localhost:8080` by default.

## Project Status

This is an MVP scaffold. The first production milestone is to make scanning, editing, and persistence solid before adding SNMP, auth, alerting, or cloud features.

