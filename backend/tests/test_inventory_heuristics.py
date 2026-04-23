import pytest
from sqlmodel import Session, create_engine, SQLModel
from app.models import Device, DeviceStatus, DeviceType
from app.services.inventory import upsert_scanned_devices
from app.services.scanner import ScannedDevice

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_do_not_overwrite_manual_device_type(session: Session):
    # Setup: A device with a manually set type (not unknown)
    mac = "aa:aa:aa:aa:aa:aa"
    device = Device(
        ip="10.0.0.1", 
        mac=mac, 
        device_type=DeviceType.nas,  # Manually set to NAS
        status=DeviceStatus.online
    )
    session.add(device)
    session.commit()

    # Scan finds it but guesses it's a PC (e.g. if it has 3389 open)
    scanned = [ScannedDevice(
        ip="10.0.0.1", 
        mac=mac, 
        device_type=DeviceType.pc
    )]
    upsert_scanned_devices(session, scanned)
    
    session.refresh(device)
    # Should STILL be NAS
    assert device.device_type == DeviceType.nas

def test_overwrite_unknown_device_type(session: Session):
    # Setup: A device with unknown type
    mac = "bb:bb:bb:bb:bb:bb"
    device = Device(
        ip="10.0.0.2", 
        mac=mac, 
        device_type=DeviceType.unknown,
        status=DeviceStatus.online
    )
    session.add(device)
    session.commit()

    # Scan finds it and guesses it's a Router
    scanned = [ScannedDevice(
        ip="10.0.0.2", 
        mac=mac, 
        device_type=DeviceType.router
    )]
    upsert_scanned_devices(session, scanned)
    
    session.refresh(device)
    # Should now be Router
    assert device.device_type == DeviceType.router
