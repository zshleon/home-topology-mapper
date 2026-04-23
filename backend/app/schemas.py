from datetime import datetime

from pydantic import BaseModel, Field

from app.models import DeviceStatus, DeviceType, EdgeConfidence, LinkType, ScanMode


class DeviceRead(BaseModel):
    id: str
    ip: str
    mac: str | None
    hostname: str | None
    vendor: str | None
    os_guess: str | None
    device_type: DeviceType
    first_seen: datetime
    last_seen: datetime
    status: DeviceStatus
    is_network_node: bool
    notes: str | None


class DeviceUpdate(BaseModel):
    hostname: str | None = None
    device_type: DeviceType | None = None
    is_network_node: bool | None = None
    notes: str | None = None


class ScanStartRequest(BaseModel):
    subnet: str | None = Field(default=None, examples=["192.168.1.0/24"])
    mode: ScanMode | None = Field(default=None, examples=["quick", "full"])


class ScanRecordRead(BaseModel):
    id: str
    started_at: datetime
    finished_at: datetime | None
    subnet: str
    scan_mode: ScanMode
    result_summary: str | None
    discovered_count: int
    new_count: int
    online_count: int
    offline_count: int
    error: str | None
    error_hint: str | None


class TopologyNodeRead(BaseModel):
    id: str
    device_id: str
    x: float
    y: float
    custom_label: str | None
    icon: str | None
    pinned: bool
    device: DeviceRead


class TopologyNodeWrite(BaseModel):
    id: str | None = None
    device_id: str
    x: float
    y: float
    custom_label: str | None = None
    icon: str | None = None
    pinned: bool = False


class TopologyEdgeRead(BaseModel):
    id: str
    from_device_id: str
    to_device_id: str
    link_type: LinkType
    confidence: EdgeConfidence
    confirmed_by_user: bool


class TopologyEdgeWrite(BaseModel):
    id: str | None = None
    from_device_id: str
    to_device_id: str
    link_type: LinkType = LinkType.unknown
    confidence: EdgeConfidence = EdgeConfidence.manual
    confirmed_by_user: bool = True


class TopologyRead(BaseModel):
    nodes: list[TopologyNodeRead]
    edges: list[TopologyEdgeRead]


class TopologyWrite(BaseModel):
    nodes: list[TopologyNodeWrite]
    edges: list[TopologyEdgeWrite]
