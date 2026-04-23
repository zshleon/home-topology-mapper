from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.models import Device, TopologyEdge, TopologyNode
from app.schemas import (
    DeviceRead,
    TopologyEdgeRead,
    TopologyNodeRead,
    TopologyRead,
    TopologyWrite,
)
from app.services.topology import ensure_topology_for_devices

router = APIRouter(prefix="/api/topology", tags=["topology"])


@router.get("", response_model=TopologyRead)
def get_topology(session: Session = Depends(get_session)) -> TopologyRead:
    ensure_topology_for_devices(session)
    session.commit()
    devices = {device.id: device for device in session.exec(select(Device)).all()}
    nodes = session.exec(select(TopologyNode)).all()
    edges = session.exec(select(TopologyEdge)).all()
    return TopologyRead(
        nodes=[
            TopologyNodeRead(
                id=node.id,
                device_id=node.device_id,
                x=node.x,
                y=node.y,
                custom_label=node.custom_label,
                icon=node.icon,
                pinned=node.pinned,
                device=DeviceRead.model_validate(devices[node.device_id], from_attributes=True),
            )
            for node in nodes
            if node.device_id in devices
        ],
        edges=[
            TopologyEdgeRead(
                id=edge.id,
                from_device_id=edge.from_device_id,
                to_device_id=edge.to_device_id,
                link_type=edge.link_type,
                confidence=edge.confidence,
                confirmed_by_user=edge.confirmed_by_user,
            )
            for edge in edges
        ],
    )


@router.put("", response_model=TopologyRead)
def save_topology(payload: TopologyWrite, session: Session = Depends(get_session)) -> TopologyRead:
    timestamp = datetime.now(UTC)
    existing_nodes = {node.device_id: node for node in session.exec(select(TopologyNode)).all()}
    for node_payload in payload.nodes:
        node = existing_nodes.get(node_payload.device_id)
        if not node:
            node = TopologyNode(device_id=node_payload.device_id)
        node.x = node_payload.x
        node.y = node_payload.y
        node.custom_label = node_payload.custom_label
        node.icon = node_payload.icon
        node.pinned = node_payload.pinned
        node.updated_at = timestamp
        session.add(node)

    for edge in session.exec(select(TopologyEdge)).all():
        session.delete(edge)

    for edge_payload in payload.edges:
        edge_data = edge_payload.model_dump(exclude_none=True)
        edge_data.pop("id", None)
        session.add(
            TopologyEdge(
                **edge_data,
                updated_at=timestamp,
            )
        )

    session.commit()
    return get_topology(session)
