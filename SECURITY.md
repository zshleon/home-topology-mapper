# Security Policy

HomeTopo is intended for trusted home and homelab networks. It scans private LAN ranges and stores local topology data in SQLite.

## Supported Versions

The project is pre-1.0. Security fixes target the current `main` branch until the first tagged release.

## Reporting Issues

Please open a private report with the maintainer when possible, or file a GitHub issue without including secrets, public IPs, tokens, passwords, or full network exports.

## Security Notes

- Do not expose the app directly to the public internet.
- Run behind a trusted VPN or reverse proxy if remote access is needed.
- The Docker Compose configuration uses host networking and raw network capabilities for LAN discovery. Review this before deploying on shared hosts.
- Do not commit scan exports, SQLite databases, or `.env` files.
