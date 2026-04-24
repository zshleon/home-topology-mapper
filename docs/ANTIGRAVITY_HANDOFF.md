# Antigravity Handoff

You are collaborating on HomeTopo with Codex and the maintainer.

## Project Goal

Build a lightweight home and homelab LAN topology mapper:

- discover devices on a private subnet
- infer IP, MAC, hostname, vendor, and rough device type
- generate an initial topology draft
- let the user drag nodes and manually connect devices
- preserve manual topology across future scans

This is not an enterprise NMS.

## Before Editing

1. Read `README.md`.
2. Read `TASKS.md`.
3. Read `AGENTS.md`.
4. Pick exactly one unchecked task.
5. Create a branch named `feature/<task-name>`.

## Hard Rules

- Manual topology edges always win over scan output.
- Do not overwrite confirmed manual relationships during incremental scans.
- Keep MVP scope tight.
- Do not add auth, cloud sync, SNMP deep discovery, alerting, traffic monitoring, or mobile apps unless `TASKS.md` changes first.
- Do not commit `.env`, databases, scan exports, or private network data.

## Useful Commands

Backend:

```bash
cd backend
pip install -e ".[dev]"
python -m compileall app
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Docker:

```bash
docker compose up -d --build
```

## Suggested First Task

Start with:

```text
scan-nmap-mvp
```

Expected work:

- harden nmap discovery
- improve quick/full scan behavior
- keep scanner output small and structured
- add clear error messages for missing nmap or permission issues

Open a PR against `main` using `.github/pull_request_template.md`.
