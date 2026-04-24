# Applying the `feat/ui-overhaul-v2` branch

This sprint's work lives entirely on the branch `feat/ui-overhaul-v2`. Because the agent
session cannot push to GitHub directly, the branch is delivered as a **git bundle**
alongside the source. You have three ways to apply it.

## Option 1 — Git bundle (recommended, 1 command)

A bundle is a single file that carries the branch and its commits. Apply from your
local clone:

```bash
cd /path/to/home-topology-mapper
git fetch ~/Documents/Claude/Projects/home-topology-mapper/feat-ui-overhaul-v2.bundle \
  feat/ui-overhaul-v2:feat/ui-overhaul-v2
git checkout feat/ui-overhaul-v2
# inspect, run it, then:
git push origin feat/ui-overhaul-v2
# open a PR on GitHub targeting main
```

If you prefer to push a ready-made Pull Request from your laptop, run:

```bash
gh pr create --base main --head feat/ui-overhaul-v2 \
  --title "feat: UI overhaul v2 — design system, dark mode, zh-CN first" \
  --body-file SPRINT_STATUS.md
```

## Option 2 — Rsync the files, commit yourself

The raw source of the branch is also mirrored into the workspace folder under
`feat-ui-overhaul-v2/`. From your local repo:

```bash
cd /path/to/home-topology-mapper
git checkout -b feat/ui-overhaul-v2 main
rsync -a --delete \
  ~/Documents/Claude/Projects/home-topology-mapper/feat-ui-overhaul-v2/ \
  .
git add -A
git commit -m "feat: UI overhaul v2 (see SPRINT_STATUS.md)"
git push origin feat/ui-overhaul-v2
```

You lose the per-step commit history this way, but you get the final state.

## Option 3 — Try it on the LXC first

Before merging to main, deploy the branch to your LXC at 10.0.0.100 and confirm the UI
loads, the language switcher works, dark mode persists, and a scan still runs.

```bash
ssh root@10.0.0.100
cd /srv/home-topology-mapper     # or wherever it lives
git fetch origin feat/ui-overhaul-v2
git checkout feat/ui-overhaul-v2
docker compose up -d --build
```

Walk through the checklist at the bottom of this file, then merge to main on GitHub.

---

## Acceptance checklist (walk through before merge)

- [ ] UI loads; first paint has no flash of unstyled/light content
- [ ] Top-right Globe toggle switches 中文 ↔ EN; preference persists across reload
- [ ] Top-right Sun/Monitor/Moon switch toggles themes; System follows OS setting
- [ ] Dashboard hero shows the indigo→cyan gradient with the network glyph
- [ ] 4 StatCards render with correct counts (Total / Online / Offline / Network nodes)
- [ ] Scanning still works; a failed scan shows a red Alert with hint
- [ ] Devices page filter input + type dropdown filter the list instantly
- [ ] Topology page: drag a node, click Save — layout persists on reload
- [ ] Topology page: online nodes show a pulsing green ring on their icon
- [ ] GitHub CI runs `pytest` (not just compileall) on the PR

---

## Rollback

If anything breaks post-merge, revert the merge commit — all 12 feature commits on
this branch are self-contained:

```bash
git revert -m 1 <merge-commit>
git push origin main
```

Or revert individual commits using the subjects in `SPRINT_STATUS.md`.

---

## Files changed summary

```
backend/app/core/config.py           | CORS / brand / locale settings
backend/app/main.py                  | CORS middleware reads whitelist
backend/app/routers/config.py        | Exposes brand/locale/scan defaults
.env.example                         | Bilingual + new env vars
.github/workflows/ci.yml             | Runs pytest + ruff + npm build
frontend/package.json                | i18next deps
frontend/tailwind.config.ts          | darkMode, RGB tokens, fonts, keyframes
frontend/index.html                  | lang, favicon, theme-color, pre-paint script
frontend/src/styles.css              | Light/dark tokens, RF overrides, print
frontend/src/main.tsx                | Wraps in ThemeProvider + imports i18n
frontend/src/App.tsx                 | Shell rewrite
frontend/src/api/client.ts           | AppConfig type
frontend/src/lib/cn.ts               | (new) cn helper
frontend/src/utils/time.ts           | (new) formatRelative
frontend/src/i18n/index.ts           | (new) i18next bootstrap
frontend/src/i18n/locales/zh-CN.json | (new) default translations
frontend/src/i18n/locales/en.json    | (new) English fallback
frontend/src/components/Brand.tsx    | (new) BrandMark + BrandBlock
frontend/src/components/ThemeProvider.tsx    | (new)
frontend/src/components/ThemeToggle.tsx      | (new)
frontend/src/components/LanguageSwitcher.tsx | (new)
frontend/src/components/TopologyNode.tsx     | (new) custom RF node
frontend/src/components/ui/Button.tsx        | (new)
frontend/src/components/ui/Card.tsx          | (new)
frontend/src/components/ui/Badge.tsx         | (new)
frontend/src/components/ui/Input.tsx         | (new)
frontend/src/components/ui/Select.tsx        | (new)
frontend/src/components/ui/StatCard.tsx      | (new)
frontend/src/components/ui/Alert.tsx         | (new)
frontend/src/components/ui/EmptyState.tsx    | (new)
frontend/src/pages/Dashboard.tsx     | Rewrite
frontend/src/pages/DevicesPage.tsx   | Rewrite
frontend/src/pages/TopologyPage.tsx  | Rewrite
README.md                            | Bilingual rewrite
docs/images/brand.svg                | (new) standalone brand SVG
SPRINT_STATUS.md                     | (new) progress tracker
APPLY.md                             | (this file)
```
