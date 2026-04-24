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
    let hint: string | undefined = undefined;

    if (contentType.includes("application/json")) {
      try {
        const data = await response.json() as { detail?: unknown; message?: unknown };
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (data.detail && typeof data.detail === "object") {
          const detail = data.detail as { message?: unknown; hint?: unknown; code?: unknown };
          message = typeof detail.message === "string"
            ? detail.message
            : (typeof detail.code === "string" ? detail.code : JSON.stringify(detail));
          hint = typeof detail.hint === "string" ? detail.hint : undefined;
        } else if (typeof data.message === "string") {
          message = data.message;
        }
      } catch {
        message = await response.text();
      }
    } else {
      const text = await response.text();
      message = text || message;
    }

    const error = new Error(message || response.statusText);
    (error as Error & { hint?: string }).hint = hint;
    throw error;
  }
  return response.json() as Promise<T>;
}

export interface AppConfig {
  brand?: {
    name?: string;
    tagline?: {
      zh?: string;
      en?: string;
    };
  };
  locale?: {
    default?: string;
  };
  scan?: {
    mode_default?: string;
  };
  offline_retention_days: number;
}

export const api = {
  devices: () => request<Device[]>("/api/devices"),
  updateDevice: (
    id: string,
    payload: {
      hostname?: string;
      device_type?: DeviceType;
      is_network_node?: boolean;
      notes?: string;
    }
  ) =>
    request<Device>(`/api/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  scans: () => request<ScanRecord[]>("/api/scans"),
  startScan: (payload: { subnet?: string; mode?: string }) =>
    request<ScanRecord>("/api/scans", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  topology: () => request<Topology>("/api/topology"),
  saveTopology: (payload: unknown) =>
    request<Topology>("/api/topology", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  config: () => request<AppConfig>("/api/config"),
  diagnostics: () =>
    request<{ checks: any[]; config_summary: any }>("/api/diagnostics")
};
