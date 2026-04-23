import { useEffect, useState } from "react";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import type { Device, DeviceType } from "../types";

const deviceTypes: DeviceType[] = [
  "unknown",
  "router",
  "switch",
  "access_point",
  "nas",
  "server",
  "pc",
  "phone",
  "tablet",
  "printer",
  "camera",
  "iot",
  "media"
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setDevices(await api.devices());
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const updateDevice = async (device: Device, patch: Partial<Device>) => {
    setSaving(device.id);
    try {
      const updated = await api.updateDevice(device.id, {
        hostname: patch.hostname ?? undefined,
        device_type: patch.device_type,
        is_network_node: patch.is_network_node,
        notes: patch.notes ?? undefined
      });
      setDevices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Devices</h2>
          <p className="text-sm text-slate-500">Correct type guesses and add notes. These manual edits survive future scans.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3 pr-3">Status</th>
              <th className="py-3 pr-3">IP</th>
              <th className="py-3 pr-3">Name</th>
              <th className="py-3 pr-3">MAC</th>
              <th className="py-3 pr-3">Vendor</th>
              <th className="py-3 pr-3">Type</th>
              <th className="py-3 pr-3">Network node</th>
              <th className="py-3 pr-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="border-b border-slate-100">
                <td className="py-3 pr-3"><StatusBadge status={device.status} /></td>
                <td className="py-3 pr-3 font-mono">{device.ip}</td>
                <td className="py-3 pr-3">
                  <input
                    defaultValue={device.hostname ?? ""}
                    onBlur={(event) => updateDevice(device, { hostname: event.target.value })}
                    className="w-40 rounded-lg border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-3 pr-3 font-mono text-xs text-slate-500">{device.mac || "-"}</td>
                <td className="py-3 pr-3">{device.vendor || "-"}</td>
                <td className="py-3 pr-3">
                  <select
                    value={device.device_type}
                    onChange={(event) => updateDevice(device, { device_type: event.target.value as DeviceType })}
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  >
                    {deviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="checkbox"
                    checked={device.is_network_node}
                    onChange={(event) => updateDevice(device, { is_network_node: event.target.checked })}
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    defaultValue={device.notes ?? ""}
                    onBlur={(event) => updateDevice(device, { notes: event.target.value })}
                    className="w-52 rounded-lg border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-3 text-xs text-slate-400">{saving === device.id ? "saving" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
