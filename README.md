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
git clone https://github.com/zshleon/home-topology-mapper.git
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

- Subnet scan through `nmap` with quick and full modes
- Device inventory with IP, MAC, hostname, vendor, type guess, online/offline state
- Topology editor powered by React Flow
- Node dragging and manual edge creation
- Save and restore topology layout
- Incremental scans preserve manual topology
- New devices are highlighted
- Offline devices are dimmed
- Scan failures keep a human-readable hint in the history record

## Deployment

### Docker Compose (Recommended)
1. Copy `.env.example` to `.env` and adjust your `HTM_SCAN_SUBNETS`.
2. Run `docker compose up -d`.
3. Access at `http://<your-ip>:8080`.

### Proxmox LXC Tips
- Use **Host Networking** (`network_mode: host` in Compose) so nmap can see the local broadcast domain.
- If using an unprivileged container, ensure you enable **Nesting** and add the **NET_RAW** capability in the LXC config file (on the PVE host):
  ```text
  lxc.cap.keep: net_raw
  ```
- Alternatively, run as a privileged container for full nmap capability (OS detection, etc.).

## Development

Start with `TASKS.md` and keep one task per branch.

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

## Collaboration

- `AGENTS.md` defines AI collaboration rules for Codex and Antigravity.
- `docs/ANTIGRAVITY_HANDOFF.md` is the handoff note for a second AI agent.
- `CONTRIBUTING.md` lists local checks and MVP scope boundaries.
- `.github/pull_request_template.md` keeps pull requests reviewable.

## Project Status

This is an MVP scaffold. The first production milestone is to make scanning, editing, and persistence solid before adding SNMP, auth, alerting, or cloud features.
