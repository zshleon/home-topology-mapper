# Contributing

HomeTopo is developed in small, reviewable tasks. The MVP should stay focused on discovery, topology editing, persistence, and Docker/LXC fit.

## Workflow

1. Read `TASKS.md`.
2. Pick one unchecked task.
3. Create a branch named `feature/<task-name>`.
4. Keep the change scoped to that task.
5. Open a pull request with the template filled in.

## Local Checks

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
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
docker build -t home-topology-mapper:local .
```

## Design Rules

- Manual topology edges and user-confirmed layout have the highest priority.
- Scans may update inventory and status, but must not overwrite confirmed manual links.
- Keep the UI lightweight, modern, and screenshot-friendly.
- Do not add multi-user auth, cloud sync, SNMP deep discovery, alerting, or enterprise NMS features during MVP work unless `TASKS.md` is updated first.
