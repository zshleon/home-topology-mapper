# AI Collaboration Guide

Home Topology Mapper is expected to be developed by a single maintainer working with AI agents such as Codex and Antigravity.

## Working Rules

1. Read `TASKS.md` first.
2. Pick one unchecked task.
3. Create a branch named `feature/<task-name>`.
4. Keep the diff small and reviewable.
5. Do not combine unrelated frontend, backend, and deployment changes unless the task requires it.
6. Manual topology data must always have priority over scan results.
7. Never introduce cloud sync, auth, SNMP, alerting, or enterprise features into MVP tasks unless `TASKS.md` is updated first.

## Coordination

- Codex and Antigravity should not work on the same task branch at the same time.
- If a task changes scope, update `TASKS.md` in the same PR.
- If a task touches scan behavior, explicitly note how manual topology data is protected.
- If a task changes Docker/LXC behavior, update `README.md` or `docs/ARCHITECTURE.md`.

## Required Checks

Backend:

```bash
cd backend
python -m compileall app
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

## Commit Format

Use:

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `docs: ...`
- `chore: ...`

## PR Template

Every PR should include:

- Task from `TASKS.md`
- Summary
- Changed files
- Test plan
- Compatibility / migration notes
