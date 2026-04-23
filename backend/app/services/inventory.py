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
        device_by_mac = session.exec(select(Device).where(Device.mac == scanned.mac)).first()
        if device_by_mac:
            return device_by_mac

        # 2. If MAC not found in DB, check by IP but only if the existing record has NO MAC
        # If it has a different MAC, it's likely a different device that took this IP
        device_by_ip = session.exec(select(Device).where(Device.ip == scanned.ip)).first()
        if device_by_ip and device_by_ip.mac is None:
            return device_by_ip
        return None

    # 3. No MAC provided in scan (e.g. permission/subnet issues), fallback to IP
    return session.exec(select(Device).where(Device.ip == scanned.ip)).first()


def upsert_scanned_devices(session: Session, scanned_devices: list[ScannedDevice]) -> tuple[set[str], int]:
    seen_ids: set[str] = set()
    new_count = 0
    timestamp = now_utc()
    for scanned in scanned_devices:
        device = find_existing_device(session, scanned)
        if device is None:
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
            # Handle IP change: if this device moved to a new IP,
            # mark any other device currently registered with that IP as offline
            if device.ip != scanned.ip:
                squatter = session.exec(
                    select(Device).where(Device.ip == scanned.ip, Device.id != device.id)
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

