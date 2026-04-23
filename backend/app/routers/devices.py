from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Device
from app.schemas import DeviceRead, DeviceUpdate

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("", response_model=list[DeviceRead])
def list_devices(session: Session = Depends(get_session)) -> list[Device]:
    return session.exec(select(Device).order_by(Device.status, Device.ip)).all()


@router.patch("/{device_id}", response_model=DeviceRead)
def update_device(
    device_id: str,
    payload: DeviceUpdate,
    session: Session = Depends(get_session),
) -> Device:
    device = session.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    device.updated_at = datetime.now(UTC)
    session.add(device)
    session.commit()
    session.refresh(device)
    return device

