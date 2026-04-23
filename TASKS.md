# TASKS

This project uses small, reviewable branches. Pick exactly one task per branch unless the maintainer explicitly expands scope.

## Phase 1 - Project Initialization

- [x] `init-monorepo`: Create monorepo structure, backend skeleton, frontend skeleton, Docker Compose, README, and AI collaboration docs.

## Phase 2 - Device Scanning And Inventory

- [x] `scan-nmap-mvp`: Harden nmap discovery and quick/full scan modes.
- [x] `device-identity-merge`: Improve MAC-first identity matching and IP-change handling.
- [/] `device-type-heuristics`: Expand home-device type guessing rules and make them configurable.
- [ ] `scan-error-ui`: Show scan errors and permission hints clearly in the dashboard.

## Phase 3 - Topology Editor

- [ ] `topology-node-editor`: Add node label/icon editing inside the topology page.
- [ ] `topology-edge-editor`: Let users choose ethernet/wifi/unknown per edge.
- [ ] `topology-delete-link`: Add explicit edge deletion UX.
- [ ] `topology-screenshot-mode`: Add a clean screenshot/share view.

## Phase 4 - Persistence And Incremental Scans

- [ ] `preserve-manual-edges`: Add tests proving scans cannot overwrite confirmed manual edges.
- [ ] `new-device-bin`: Place newly discovered devices in a visible unclassified area.
- [ ] `offline-device-policy`: Add configurable offline retention and visual style.

## Phase 5 - Docker And LXC Fit

- [ ] `lxc-permission-checks`: Add startup diagnostics for nmap, NET_RAW, host networking, and subnet reachability.
- [ ] `compose-production-polish`: Add healthcheck, labels, and documented env vars.
- [x] `release-template`: Add GitHub release checklist and versioning.
