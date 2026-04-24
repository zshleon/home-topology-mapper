# Sprint Status — UI Overhaul v2

> Supervisor: Claude. Mission: make HomeWeb 易用、漂亮舒服、广受欢迎.
> Branch: `feat/ui-overhaul-v2` against `main`.
> Started: 2026-04-24. Target: mergeable PR within the week.

This document is the single source of truth for what has been done and what remains.
Committed on each step so work survives any agent restart.

## Goal
The original TASKS.md MVP is functionally complete but visually bland and monolingual.
This sprint delivers the perception layer — design system, dark mode, Chinese-first UX,
brand identity — plus the first backend hardening pass (CORS + config).

## Sprint scope (ordered by leverage, not difficulty)

- [ ] **B1** Backend: CORS whitelist, brand/locale config, expose via `/api/config`
- [ ] **F1** Design tokens + Tailwind dark mode + CSS variable palette
- [ ] **F2** UI primitives (`ui/Button`, `Card`, `Badge`, `Input`, `Select`, `StatCard`, `Alert`, `EmptyState`)
- [ ] **F3** ThemeProvider + ThemeToggle + LanguageSwitcher
- [ ] **F4** i18n — i18next with zh-CN default, en fallback; full translation coverage
- [ ] **F5** Brand — HomeWeb name, SVG network glyph, inline favicon, bilingual tagline
- [ ] **F6** App shell rewrite — sidebar + top bar + mobile nav
- [ ] **F7** Dashboard rewrite — hero gradient, StatCard grid, Alert, relative time
- [ ] **F8** Devices rewrite — filter card, mobile cards, desktop table
- [ ] **F9** Topology rewrite — custom TopologyNode with status ring, Dots background, themed MiniMap
- [ ] **D1** README bilingual rewrite, screenshot placeholders, install guide
- [ ] **D2** CI: pytest step; bundle + APPLY.md for user to push

## Deferred to next sprint (intentional)
- Async scanning + SSE progress (P0 UX — but doesn't change first-impression)
- mDNS/SSDP/UPnP discovery (needs new deps, more testing surface)
- YAML-driven fingerprint engine
- Auto-force-directed layout via dagre
- Vitest + backend test harness expansion

## Naming decision
- Product: **HomeWeb**
- Tagline (zh): 看见你家的网
- Tagline (en): See your home network
- Primary brand color: indigo `--brand: 99 102 241` (light) / `129 140 248` (dark)
- Fallback internal code name `home-topology-mapper` stays (repo/package).

## Rollback plan
Every change lives on branch `feat/ui-overhaul-v2`. If review uncovers issues,
revert individual commits rather than force-push. Each commit is scoped to
one of the boxes above.

## Progress log
