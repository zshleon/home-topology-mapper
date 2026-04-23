from __future__ import annotations

import ipaddress
import math
from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import Device, DeviceStatus, EdgeConfidence, LinkType, TopologyEdge, TopologyNode


def now_utc() -> datetime:
    return datetime.now(UTC)


def ip_key(ip: str) -> int:
    return int(ipaddress.ip_address(ip))


def initial_position(index: int, total: int, is_network_node: bool) -> tuple[float, float]:
    if is_network_node:
        return 120 + index * 220, 120
    cols = max(4, math.ceil(math.sqrt(max(total, 1))))
    col = index % cols
    row = index // cols
    return 120 + col * 220, 300 + row * 150


def ensure_topology_for_devices(session: Session) -> None:
    devices = session.exec(select(Device).order_by(Device.ip)).all()
    # Get all current nodes to detect if this is an incremental discovery
    all_nodes = session.exec(select(TopologyNode)).all()
    existing_device_ids = {node.device_id for node in all_nodes}
    is_incremental = len(existing_device_ids) > 0

    network_index = 0
    endpoint_index = 0
    new_discovery_index = 0

    # Stable sort to keep initial indices consistent
    sorted_devices = sorted(devices, key=lambda item: ip_key(item.ip))

    for device in sorted_devices:
        if device.id not in existing_device_ids:
            if is_incremental:
                # NEW DEVICE BIN: Column on the left (negative X)
                x = -400
                y = 120 + new_discovery_index * 160
                new_discovery_index += 1
            else:
                # First scan: Use normal grid/row layout
                if device.is_network_node:
                    x, y = initial_position(network_index, len(devices), True)
                    network_index += 1
                else:
                    x, y = initial_position(endpoint_index, len(devices), False)
                    endpoint_index += 1
            
            session.add(TopologyNode(device_id=device.id, x=x, y=y, pinned=False))

    session.flush()
    devices = session.exec(select(Device).order_by(Device.ip)).all()
    edges = session.exec(select(TopologyEdge)).all()
    has_incoming = {edge.to_device_id for edge in edges}
    manual_device_ids = {
        edge.to_device_id
        for edge in edges
        if edge.confirmed_by_user or edge.confidence == EdgeConfidence.manual
    }

    gateway = next((d for d in devices if d.device_type.value == "router"), None)
    if not gateway:
        return

    for device in devices:
        if device.id == gateway.id:
            continue
        if device.id in has_incoming or device.id in manual_device_ids:
            continue
        session.add(
            TopologyEdge(
                from_device_id=gateway.id,
                to_device_id=device.id,
                link_type=LinkType.unknown,
                confidence=EdgeConfidence.auto,
                confirmed_by_user=False,
            )
        )


def mark_offline_devices(session: Session, seen_ids: set[str], subnet: str) -> int:
    network = ipaddress.ip_network(subnet, strict=False)
    count = 0
    for device in session.exec(select(Device)).all():
        if ipaddress.ip_address(device.ip) in network and device.id not in seen_ids:
            if device.status != DeviceStatus.offline:
                count += 1
            device.status = DeviceStatus.offline
            device.updated_at = now_utc()
            session.add(device)
    return count

