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
    const contentType = response.headers.get("content-type") ?? "";
    let message = response.statusText;
    if (contentType.includes("application/json")) {
      try {
        const data = await response.json() as { detail?: unknown; message?: unknown };
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (data.detail && typeof data.detail === "object") {
          const detail = data.detail as { message?: unknown; hint?: unknown; code?: unknown };
          const parts = [
            typeof detail.code === "string" ? detail.code : null,
            typeof detail.message === "string" ? detail.message : null,
            typeof detail.hint === "string" ? detail.hint : null
          ].filter(Boolean);
          message = parts.join("\n");
        } else if (typeof data.message === "string") {
          message = data.message;
        } else {
          message = JSON.stringify(data);
        }
      } catch {
        message = await response.text();
      }
    } else {
      const text = await response.text();
      message = text || message;
    }
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
    request<Topology>("/api/topology", { method: "PUT", body: JSON.stringify(payload) })
};
