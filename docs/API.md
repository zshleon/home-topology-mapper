# API Design

## Start Scan

`POST /api/scans`

```json
{
  "subnet": "192.168.1.0/24",
  "mode": "quick"
}
```

Returns a `ScanRecord`.

Accepted scan modes:

- `quick`: common home-homelab ports only
- `full`: scan all TCP ports, slower but more exhaustive

On failure, the scan history record also stores `error_hint` for operator guidance.

## Scan History

`GET /api/scans`

Returns the latest 25 scan records.

## Device List

`GET /api/devices`

Returns all known devices with online/offline state.

## Update Device

`PATCH /api/devices/{device_id}`

```json
{
  "hostname": "Living Room Apple TV",
  "device_type": "media",
  "is_network_node": false,
  "notes": "Confirmed by user"
}
```

## Get Topology

`GET /api/topology`

Returns nodes with embedded device records and edges.

## Save Topology

`PUT /api/topology`

```json
{
  "nodes": [
    {
      "device_id": "device-id",
      "x": 120,
      "y": 300,
      "custom_label": "Router",
      "icon": "router",
      "pinned": true
    }
  ],
  "edges": [
    {
      "from_device_id": "router-id",
      "to_device_id": "nas-id",
      "link_type": "ethernet",
      "confidence": "manual",
      "confirmed_by_user": true
    }
  ]
}
```
