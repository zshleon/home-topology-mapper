from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import settings
from app.db.session import get_session
from app.models import Device, DeviceStatus, ScanRecord
from app.schemas import ScanRecordRead, ScanStartRequest
from app.services.inventory import upsert_scanned_devices
from app.services.scanner import ScanError, normalize_scan_mode, scan_subnet
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
    mode = normalize_scan_mode(payload.mode or settings.scan_mode)
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
    except ScanError as exc:
        record.error = str(exc)
        record.error_hint = exc.hint
        session.add(record)
        session.commit()
        raise HTTPException(
            status_code=500,
            detail={
                "code": exc.code,
                "message": str(exc),
                "hint": exc.hint,
            },
        ) from exc
    except Exception as exc:
        record.error = str(exc)
        record.error_hint = "An unexpected error occurred. Check backend logs for details."
        session.add(record)
        session.commit()
        raise HTTPException(
            status_code=500,
            detail={"message": str(exc), "hint": record.error_hint},
        ) from exc
    finally:
        record.finished_at = datetime.now(UTC)
        session.add(record)
        session.commit()
        session.refresh(record)
    return record
