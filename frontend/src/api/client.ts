import type { Device, DeviceType, ScanRecord, Topology } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json() as Promise<T>;
}

export const api = {
  devices: () => request<Device[]>("/api/devices"),
  updateDevice: (id: string, payload: { hostname?: string; device_type?: DeviceType; is_network_node?: boolean; notes?: string }) =>
    request<Device>(`/api/devices/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  scans: () => request<ScanRecord[]>("/api/scans"),
  startScan: (payload: { subnet?: string; mode?: string }) =>
    request<ScanRecord>("/api/scans", { method: "POST", body: JSON.stringify(payload) }),
  topology: () => request<Topology>("/api/topology"),
  saveTopology: (payload: unknown) =>
    request<Topology>("/api/topology", { method: "PUT", body: JSON.stringify(payload) }),
  diagnostics: () => request<{ checks: any[]; config_summary: any }>("/api/diagnostics")
};

