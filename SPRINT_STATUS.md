# Sprint Status — UI Overhaul v2

> Supervisor: Claude. Mission: make HomeTopo 易用、漂亮舒服、广受欢迎.
> Branch: `feat/ui-overhaul-v2` against `main`.
> Started: 2026-04-24. Commits shipped on this branch tell the whole story.

This document is the single source of truth for what has been done and what remains.
Committed on each step so work survives any agent restart.

## Goal
The original TASKS.md MVP was functionally complete but visually bland and monolingual.
This sprint delivers the perception layer — design system, dark mode, Chinese-first UX,
brand identity — plus the first backend hardening pass (CORS + config).

## Sprint scope — status

- [x] **B1** Backend: CORS whitelist, brand/locale config, expose via `/api/config`
- [x] **F1** Design tokens + Tailwind dark mode + CSS variable palette
- [x] **F2** UI primitives (`Button`, `Card`, `Badge`, `Input`, `Select`, `StatCard`, `Alert`, `EmptyState`)
- [x] **F3** ThemeProvider + ThemeToggle + LanguageSwitcher
- [x] **F4** i18n — i18next with zh-CN default, en fallback; full translation coverage
- [x] **F5** Brand — HomeTopo name, SVG network glyph, inline favicon, bilingual tagline
- [x] **F6** App shell rewrite — sidebar + top bar + mobile nav
- [x] **F7** Dashboard rewrite — hero gradient, StatCard grid, Alert, relative time
- [x] **F8** Devices rewrite — filter card, mobile cards, desktop table
- [x] **F9** Topology rewrite — custom TopologyNode with status ring, Dots background, themed MiniMap
- [x] **D1** README bilingual rewrite, brand SVG, roadmap pointers
- [x] **D2** CI: pytest + ruff backend, npm build frontend (caches enabled)

## Deferred to next sprint (intentional)
- Async scanning + SSE progress (P0 UX — doesn't change first-impression, next priority)
- mDNS / SSDP / UPnP discovery (needs new Python deps, more testing surface)
- YAML-driven fingerprint engine
- Auto-force-directed layout via dagre
- Vitest / @testing-library setup for frontend primitives

## Naming (locked in)
- Product: **HomeTopo**
- Tagline (zh): 家庭网络拓扑
- Tagline (en): Home network topology
- Primary brand color: indigo `--brand: 99 102 241` (light) / `129 140 248` (dark)
- Repo and package stay `hometopo` to preserve stars/history

## Rollback plan
Every change lives on branch `feat/ui-overhaul-v2`. If review uncovers issues,
revert individual commits rather than force-push. Each commit is scoped to one box above.

## How to apply on your side
See [`APPLY.md`](APPLY.md) for the one-line git command.

## Progress log (commit by commit)

| Stage | Commit subject |
|---|---|
| init | `docs: add SPRINT_STATUS.md tracker for UI overhaul v2` |
| B1   | `feat(backend): CORS whitelist, brand/locale config, richer /api/config` |
| F1   | `feat(frontend): design tokens + Tailwind dark mode + themed React Flow` |
| F2   | `feat(ui): primitive component library + Brand glyph` |
| F3   | `feat(frontend): ThemeProvider (light\|dark\|system) + ThemeToggle + LanguageSwitcher` |
| F4   | `feat(i18n): i18next + zh-CN (default) + en, formatRelative helper` |
| F5+F6| `feat(frontend): app shell + index.html + entry wiring` |
| F7   | `feat(dashboard): hero + StatCard grid + scan form + history card` |
| F8   | `feat(devices): filter card + mobile cards + desktop table + i18n` |
| F9   | `feat(topology): custom TopologyNode + themed canvas + redesigned inspector` |
| D1   | `docs(readme): bilingual HomeTopo README + brand logo` |
| D2   | `ci: run pytest + ruff on backend, add pip/npm caches, typecheck frontend` |
| fix  | `fix(frontend): sync package lock for i18n deps` |
| fix  | `fix(ci): address typecheck and ruff failures` |

## What actually changed (big picture)

- **44 files touched, all on branch `feat/ui-overhaul-v2`**
- **12 new components/files** under `frontend/src/{components,components/ui,lib,i18n,utils}`
- **Zero breaking API changes** — existing `/api/devices`, `/api/scans`, `/api/topology`, `/api/config` responses are a superset of what they were
- **One new dependency group** in frontend: `i18next`, `react-i18next`, `i18next-browser-languagedetector`
- **CI follow-up fixed** — package lock now includes the i18n deps, frontend typecheck passes, and backend ruff issues are cleaned up
- **CORS default unchanged** (`*`) so existing deployments keep working; `HTM_CORS_ORIGINS=http://10.0.0.100` is the recommended prod override

## Next sprint preview (when you're ready)

1. **Async scanning + SSE**: `POST /api/scans` returns `job_id`, `GET /api/scans/{id}/events` streams progress events. Frontend shows progress bar with current IP; no more 10-minute frozen button on full scans.
2. **mDNS / SSDP / UPnP**: optional second pass that fills in hostnames and device types nmap alone cannot.
3. **Force-directed layout**: `dagre` or `d3-force` one-time layout on first load, then preserved via pin.
4. **Frontend tests**: Vitest + @testing-library/react on the UI primitives.
5. **Release engineering**: tag `v0.2.0`, publish Docker image to GHCR, PR to `awesome-selfhosted`.
