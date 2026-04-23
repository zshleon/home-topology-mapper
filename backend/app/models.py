from datetime import UTC, datetime
from enum import Enum
from uuid import uuid4

from sqlmodel import Field, SQLModel


def now_utc() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return str(uuid4())


class DeviceStatus(str, Enum):
    online = "online"
    offline = "offline"


class DeviceType(str, Enum):
    unknown = "unknown"
    router = "router"
    switch = "switch"
    access_point = "access_point"
    nas = "nas"
    server = "server"
    pc = "pc"
    phone = "phone"
    tablet = "tablet"
    printer = "printer"
    camera = "camera"
    iot = "iot"
    media = "media"


class EdgeConfidence(str, Enum):
    auto = "auto"
    manual = "manual"


class LinkType(str, Enum):
    ethernet = "ethernet"
    wifi = "wifi"
    unknown = "unknown"


class Device(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    ip: str = Field(index=True)
    mac: str | None = Field(default=None, index=True)
    hostname: str | None = Field(default=None, index=True)
    vendor: str | None = None
    os_guess: str | None = None
    device_type: DeviceType = Field(default=DeviceType.unknown, index=True)
    first_seen: datetime = Field(default_factory=now_utc, index=True)
    last_seen: datetime = Field(default_factory=now_utc, index=True)
    status: DeviceStatus = Field(default=DeviceStatus.online, index=True)
    is_network_node: bool = False
    notes: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class TopologyNode(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    device_id: str = Field(foreign_key="device.id", index=True, unique=True)
    x: float = 0
    y: float = 0
    custom_label: str | None = None
    icon: str | None = None
    pinned: bool = False
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class TopologyEdge(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    from_device_id: str = Field(foreign_key="device.id", index=True)
    to_device_id: str = Field(foreign_key="device.id", index=True)
    link_type: LinkType = LinkType.unknown
    confidence: EdgeConfidence = EdgeConfidence.auto
    confirmed_by_user: bool = False
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class ScanRecord(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    started_at: datetime = Field(default_factory=now_utc, index=True)
    finished_at: datetime | None = Field(default=None, index=True)
    subnet: str
    scan_mode: str = "quick"
    result_summary: str | None = None
    discovered_count: int = 0
    new_count: int = 0
    online_count: int = 0
    offline_count: int = 0
    error: str | None = None

