# Architecture

## System Modules

### Backend

FastAPI owns:

- scan orchestration
- device identity merge
- SQLite persistence
- topology read/write API
- static frontend serving in production Docker

### Scanner

The MVP scanner calls `nmap` directly:

- `nmap -sn` discovers live hosts and ARP MAC/vendor data
- a quick TCP port scan enriches device type guesses
- full scans are available but not the default

Scapy is intentionally deferred until the project needs packet-level ARP control or richer L2 discovery.

### Storage

SQLite stores:

- devices
- topology node positions
- topology edges
- scan history

MAC address is the primary identity signal when available. IP is a fallback because home devices often move, and phones may use private Wi-Fi MAC addresses.

### Topology

Automatic topology is only a draft:

- new devices receive default positions
- auto edges can be generated from the gateway
- user-confirmed edges are saved as manual
- future scans update online/offline state but do not replace confirmed relationships

### Frontend

React + React Flow owns:

- topology canvas
- drag/drop node layout
- manual edge drawing
- device inventory correction
- scan trigger and scan history display

## LXC Deployment Notes

For useful scanning from Docker inside a PVE LXC:

- use host networking
- grant `NET_RAW`
- install `nmap` in the runtime image
- run the LXC with nesting enabled if Docker runs inside it

The provided Compose file is optimized for a trusted home lab environment, not for untrusted multi-user hosting.

