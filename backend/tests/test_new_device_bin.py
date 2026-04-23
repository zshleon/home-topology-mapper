import pytest
from sqlmodel import Session, create_engine, SQLModel, select
from app.models import Device, DeviceStatus, DeviceType, TopologyNode
from app.services.topology import ensure_topology_for_devices

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_new_device_placed_in_bin_on_incremental_scan(session: Session):
    # Setup: First scan with one device
    device_1 = Device(id="d1", ip="10.0.0.1", device_type=DeviceType.router, status=DeviceStatus.online)
    session.add(device_1)
    session.commit()
    
    ensure_topology_for_devices(session)
    
    node_1 = session.exec(select(TopologyNode).where(TopologyNode.device_id == "d1")).one()
    # First scan node should be in normal area (x >= 0)
    assert node_1.x >= 0
    
    # Setup: Second device discovered later
    device_2 = Device(id="d2", ip="10.0.0.2", device_type=DeviceType.pc, status=DeviceStatus.online)
    session.add(device_2)
    session.commit()
    
    ensure_topology_for_devices(session)
    
    node_2 = session.exec(select(TopologyNode).where(TopologyNode.device_id == "d2")).one()
    # New device in incremental scan should be in the bin (x < 0)
    assert node_2.x < 0
    
    # Old device should NOT have moved
    session.refresh(node_1)
    assert node_1.x >= 0

def test_manual_position_preserved(session: Session):
    # Setup: First scan
    device_1 = Device(id="d1", ip="10.0.0.1", device_type=DeviceType.router, status=DeviceStatus.online)
    session.add(device_1)
    session.commit()
    ensure_topology_for_devices(session)
    
    node_1 = session.exec(select(TopologyNode).where(TopologyNode.device_id == "d1")).one()
    original_x = node_1.x
    
    # Manual move
    node_1.x = 1337
    node_1.y = 1337
    session.add(node_1)
    session.commit()
    
    # New device discovered
    device_2 = Device(id="d2", ip="10.0.0.2", device_type=DeviceType.pc, status=DeviceStatus.online)
    session.add(device_2)
    session.commit()
    
    ensure_topology_for_devices(session)
    
    # Check node_1 position
    session.refresh(node_1)
    assert node_1.x == 1337
    assert node_1.y == 1337
