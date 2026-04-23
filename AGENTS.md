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

