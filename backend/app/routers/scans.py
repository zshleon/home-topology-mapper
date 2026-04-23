from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import get_session
from app.models import Device, DeviceStatus, ScanRecord
from app.schemas import ScanRecordRead, ScanStartRequest
from app.services.inventory import upsert_scanned_devices
from app.services.scanner import scan_subnet
from app.services.topology import ensure_topology_for_devices, mark_offline_devices

router = APIRouter(prefix="/api/scans", tags=["scans"])


@router.get("", response_model=list[ScanRecordRead])
def scan_history(session: Session = Depends(get_session)) -> list[ScanRecord]:
    return session.exec(select(ScanRecord).order_by(ScanRecord.started_at.desc()).limit(25)).all()


@router.post("", response_model=ScanRecordRead)
def start_scan(
    payload: ScanStartRequest,
    session: Session = Depends(get_session),
) -> ScanRecord:
    subnet = payload.subnet or settings.subnet_list[0]
    mode = payload.mode or settings.scan_mode
    record = ScanRecord(subnet=subnet, scan_mode=mode)
    session.add(record)
    session.commit()
    session.refresh(record)

    try:
        scanned = scan_subnet(subnet, mode)
        seen_ids, new_count = upsert_scanned_devices(session, scanned)
        offline_count = mark_offline_devices(session, seen_ids, subnet)
        ensure_topology_for_devices(session)
        online_count = session.exec(select(Device).where(Device.status == DeviceStatus.online)).all()
        record.discovered_count = len(scanned)
        record.new_count = new_count
        record.online_count = len(online_count)
        record.offline_count = offline_count
        record.result_summary = (
            f"discovered={len(scanned)}, new={new_count}, online={record.online_count}, "
            f"marked_offline={offline_count}"
        )
    except Exception as exc:
        error_msg = str(exc)
        hint = "An unexpected error occurred during scanning."
        
        if "nmap is not installed" in error_msg:
            hint = "Nmap is missing. Please install it in the container (e.g., apk add nmap or apt-get install nmap)."
        elif "Operation not permitted" in error_msg or "NET_RAW" in error_msg:
            hint = "Permission denied. Nmap requires root or NET_RAW capabilities. In LXC/Docker, check host networking or privileged mode."
        elif "timed out" in error_msg.lower():
            hint = "Scan timed out. The network might be too large or slow. Try a smaller range or 'quick' mode."
        elif "failed" in error_msg.lower():
            hint = "Scan failed. Check if the target subnet is reachable from this host."

        record.error = f"{error_msg} | HINT: {hint}"
        session.add(record)
        session.commit()
        raise HTTPException(
            status_code=500, 
            detail={"message": error_msg, "hint": hint}
        ) from exc
    finally:
        record.finished_at = datetime.now(UTC)
        session.add(record)
        session.commit()
        session.refresh(record)
    return record

