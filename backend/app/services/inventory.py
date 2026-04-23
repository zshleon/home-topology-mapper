from __future__ import annotations

from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import Device, DeviceStatus
from app.services.scanner import ScannedDevice


def now_utc() -> datetime:
    return datetime.now(UTC)


def find_existing_device(session: Session, scanned: ScannedDevice) -> Device | None:
    if scanned.mac:
        # 1. Highest priority: Match by MAC
        # Only in the scan results without MAC should IP matching be used for fallback.
        return session.exec(select(Device).where(Device.mac == scanned.mac)).first()

    # 2. No MAC provided in scan -> use IP matching
    # Prioritize active/online records to avoid hitting stale offline history
    statement = select(Device).where(Device.ip == scanned.ip)
    # DeviceStatus.online ("online") sorts after DeviceStatus.offline ("offline")
    return session.exec(statement.order_by(Device.status.desc())).first()


def upsert_scanned_devices(session: Session, scanned_devices: list[ScannedDevice]) -> tuple[set[str], int]:
    seen_ids: set[str] = set()
    new_count = 0
    timestamp = now_utc()
    for scanned in scanned_devices:
        device = find_existing_device(session, scanned)
        if device is None:
            # IP Squatter check: if this IP is taken by another online device, mark it offline
            # This handles the case where a new MAC appears on an existing IP
            squatter = session.exec(
                select(Device).where(Device.ip == scanned.ip, Device.status == DeviceStatus.online)
            ).first()
            if squatter:
                squatter.status = DeviceStatus.offline
                session.add(squatter)

            device = Device(
                ip=scanned.ip,
                mac=scanned.mac,
                hostname=scanned.hostname,
                vendor=scanned.vendor,
                os_guess=scanned.os_guess,
                device_type=scanned.device_type,
                is_network_node=scanned.is_network_node,
                first_seen=timestamp,
            )
            new_count += 1
        else:
            # Handle IP change: if an existing device (found by MAC) moved to a new IP,
            # mark any other device currently online at the new IP as offline
            if device.ip != scanned.ip:
                squatter = session.exec(
                    select(Device).where(
                        Device.ip == scanned.ip,
                        Device.id != device.id,
                        Device.status == DeviceStatus.online,
                    )
                ).first()
                if squatter:
                    squatter.status = DeviceStatus.offline
                    session.add(squatter)

            device.ip = scanned.ip
            device.mac = scanned.mac or device.mac
            device.hostname = scanned.hostname or device.hostname
            device.vendor = scanned.vendor or device.vendor
            device.os_guess = scanned.os_guess or device.os_guess
            if device.device_type.value == "unknown" and scanned.device_type.value != "unknown":
                device.device_type = scanned.device_type
            device.is_network_node = device.is_network_node or scanned.is_network_node
        device.last_seen = timestamp
        device.status = DeviceStatus.online
        device.updated_at = timestamp
        session.add(device)
        session.flush()
        seen_ids.add(device.id)
    return seen_ids, new_count

