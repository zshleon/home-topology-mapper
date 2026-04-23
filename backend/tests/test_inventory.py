import pytest
from sqlmodel import Session, create_engine, SQLModel, select
from app.models import Device, DeviceStatus, DeviceType
from app.services.inventory import find_existing_device, upsert_scanned_devices
from app.services.scanner import ScannedDevice

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_find_existing_device_by_mac(session: Session):
    # Setup
    mac = "aa:bb:cc:dd:ee:ff"
    device = Device(ip="10.0.0.1", mac=mac, hostname="dev1")
    session.add(device)
    session.commit()

    # Scan with same MAC, different IP
    scanned = ScannedDevice(ip="10.0.0.2", mac=mac)
    found = find_existing_device(session, scanned)
    
    assert found is not None
    assert found.id == device.id
    assert found.hostname == "dev1"

def test_find_existing_device_by_ip_fallback(session: Session):
    # Setup
    ip = "10.0.0.5"
    device = Device(ip=ip, mac=None, hostname="no-mac-device")
    session.add(device)
    session.commit()

    # Scan with same IP, now has MAC. 
    # Safe Fallback: Should match the existing no-mac device to enrich it.
    scanned = ScannedDevice(ip=ip, mac="11:22:33:44:55:66")
    found = find_existing_device(session, scanned)
    
    assert found is not None
    assert found.id == device.id

def test_ip_conflict_handling(session: Session):
    # Device A: MAC_A, IP_1
    mac_a = "aa:aa:aa:aa:aa:aa"
    device_a = Device(ip="10.0.0.1", mac=mac_a, hostname="DeviceA")
    # Device B: MAC_B, IP_2
    mac_b = "bb:bb:bb:bb:bb:bb"
    device_b = Device(ip="10.0.0.2", mac=mac_b, hostname="DeviceB")
    
    session.add(device_a)
    session.add(device_b)
    session.commit()

    # Scan finds MAC_A with IP_2 (IP has moved)
    scanned = [ScannedDevice(ip="10.0.0.2", mac=mac_a)]
    seen_ids, new_count = upsert_scanned_devices(session, scanned)
    
    session.refresh(device_a)
    session.refresh(device_b)
    
    assert device_a.ip == "10.0.0.2"
    assert device_b.status == DeviceStatus.offline

def test_new_mac_hijacks_ip(session: Session):
    # Device A: MAC_A, IP_1 (Online)
    ip = "10.0.0.10"
    device_a = Device(ip=ip, mac="aa:aa", hostname="OldDevice", status=DeviceStatus.online)
    session.add(device_a)
    session.commit()

    # Scan finds NEW_MAC with SAME IP
    scanned = [ScannedDevice(ip=ip, mac="bb:bb", hostname="NewDevice")]
    seen_ids, new_count = upsert_scanned_devices(session, scanned)

    session.refresh(device_a)
    assert device_a.status == DeviceStatus.offline
    
    # Verify new device is created and online
    new_device = session.exec(select(Device).where(Device.mac == "bb:bb")).first()
    assert new_device is not None
    assert new_device.status == DeviceStatus.online
    assert new_device.ip == ip

def test_ip_fallback_prioritizes_online(session: Session):
    # Setup: Two records with same IP, one offline (stale), one online
    ip = "10.0.0.20"
    stale_device = Device(ip=ip, mac=None, hostname="Stale", status=DeviceStatus.offline)
    active_device = Device(ip=ip, mac=None, hostname="Active", status=DeviceStatus.online)
    session.add(stale_device)
    session.add(active_device)
    session.commit()

    # Scan with same IP, NO MAC
    scanned = ScannedDevice(ip=ip, mac=None)
    found = find_existing_device(session, scanned)

    assert found is not None
    assert found.id == active_device.id
    assert found.hostname == "Active"
