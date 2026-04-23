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
    let detail: any = await response.text();
    try {
      detail = JSON.parse(detail);
    } catch {
      // Not JSON
    }
    const message = typeof detail === "object" ? (detail.detail?.message || detail.detail || "Request failed") : detail;
    const hint = typeof detail === "object" ? detail.detail?.hint : undefined;
    
    const error = new Error(message);
    (error as any).hint = hint;
    throw error;
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
    request<Topology>("/api/topology", { method: "PUT", body: JSON.stringify(payload) })
};

