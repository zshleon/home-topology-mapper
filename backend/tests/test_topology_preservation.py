import pytest
from sqlmodel import Session, create_engine, SQLModel, select
from app.models import Device, DeviceStatus, DeviceType, TopologyEdge, EdgeConfidence, LinkType
from app.services.topology import ensure_topology_for_devices

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_preserve_confirmed_edge(session: Session):
    # Setup: Gateway and Device
    gateway = Device(id="gw", ip="10.0.0.1", device_type=DeviceType.router, status=DeviceStatus.online)
    device_a = Device(id="a", ip="10.0.0.10", device_type=DeviceType.pc, status=DeviceStatus.online)
    session.add(gateway)
    session.add(device_a)
    session.commit()

    # Manual edge: Node B -> Device A (instead of gateway)
    # First need a node for B
    node_b_device = Device(id="b", ip="10.0.0.2", device_type=DeviceType.switch, status=DeviceStatus.online)
    session.add(node_b_device)
    session.commit()
    
    manual_edge = TopologyEdge(
        from_device_id="b",
        to_device_id="a",
        link_type=LinkType.ethernet,
        confidence=EdgeConfidence.manual,
        confirmed_by_user=True
    )
    session.add(manual_edge)
    session.commit()

    # Run ensure_topology
    ensure_topology_for_devices(session)
    
    # Assert: Device A should still only have the manual edge from B
    # No auto edge from gateway should have been created
    edges = session.exec(select(TopologyEdge).where(TopologyEdge.to_device_id == "a")).all()
    assert len(edges) == 1
    assert edges[0].from_device_id == "b"
    assert edges[0].confidence == EdgeConfidence.manual
    assert edges[0].confirmed_by_user is True

def test_auto_edge_creation_for_new_device(session: Session):
    # Setup: Gateway
    gateway = Device(id="gw", ip="10.0.0.1", device_type=DeviceType.router, status=DeviceStatus.online)
    session.add(gateway)
    session.commit()

    # New device without edge
    device_a = Device(id="a", ip="10.0.0.10", device_type=DeviceType.pc, status=DeviceStatus.online)
    session.add(device_a)
    session.commit()

    # Run ensure_topology
    ensure_topology_for_devices(session)
    
    # Assert: Auto edge from gateway created
    edges = session.exec(select(TopologyEdge).where(TopologyEdge.to_device_id == "a")).all()
    assert len(edges) == 1
    assert edges[0].from_device_id == "gw"
    assert edges[0].confidence == EdgeConfidence.auto

def test_preserve_manual_confidence_edge(session: Session):
    # Similar to first test but only confidence=manual (confirmed_by_user=False)
    gateway = Device(id="gw", ip="10.0.0.1", device_type=DeviceType.router, status=DeviceStatus.online)
    device_a = Device(id="a", ip="10.0.0.10", device_type=DeviceType.pc, status=DeviceStatus.online)
    session.add(gateway)
    session.add(device_a)
    
    manual_edge = TopologyEdge(
        from_device_id="gw",
        to_device_id="a",
        link_type=LinkType.wifi,
        confidence=EdgeConfidence.manual,
        confirmed_by_user=False
    )
    session.add(manual_edge)
    session.commit()

    ensure_topology_for_devices(session)
    
    edges = session.exec(select(TopologyEdge).where(TopologyEdge.to_device_id == "a")).all()
    assert len(edges) == 1
    assert edges[0].confidence == EdgeConfidence.manual
    assert edges[0].link_type == LinkType.wifi
