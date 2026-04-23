export type DeviceStatus = "online" | "offline";
export type DeviceType =
  | "unknown"
  | "router"
  | "switch"
  | "access_point"
  | "nas"
  | "server"
  | "pc"
  | "phone"
  | "tablet"
  | "printer"
  | "camera"
  | "iot"
  | "media";

export interface Device {
  id: string;
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
  os_guess: string | null;
  device_type: DeviceType;
  first_seen: string;
  last_seen: string;
  status: DeviceStatus;
  is_network_node: boolean;
  notes: string | null;
}

export interface ScanRecord {
  id: string;
  started_at: string;
  finished_at: string | null;
  subnet: string;
  scan_mode: string;
  result_summary: string | null;
  discovered_count: number;
  new_count: number;
  online_count: number;
  offline_count: number;
  error: string | null;
}

export interface TopologyNode {
  id: string;
  device_id: string;
  x: number;
  y: number;
  custom_label: string | null;
  icon: string | null;
  pinned: boolean;
  device: Device;
}

export interface TopologyEdge {
  id: string;
  from_device_id: string;
  to_device_id: string;
  link_type: "ethernet" | "wifi" | "unknown";
  confidence: "auto" | "manual";
  confirmed_by_user: boolean;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

