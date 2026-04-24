import { useEffect, useMemo, useState } from "react";
import { Laptop, Router, Search, ServerCog, Signal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { Device, DeviceType } from "../types";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { formatRelative } from "../utils/time";
import { cn } from "../lib/cn";

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

const deviceTypeI18nKey: Record<DeviceType, string> = {
  unknown:      "deviceTypes.unknown",
  router:       "deviceTypes.router",
  switch:       "deviceTypes.switch",
  access_point: "deviceTypes.ap",
  nas:          "deviceTypes.nas",
  server:       "deviceTypes.server",
  pc:           "deviceTypes.computer",
  phone:        "deviceTypes.phone",
  tablet:       "deviceTypes.tablet",
  printer:      "deviceTypes.printer",
  camera:       "deviceTypes.camera",
  iot:          "deviceTypes.iot",
  media:        "deviceTypes.tv"
};

function StatusPill({ status }: { status: Device["status"] }) {
  const { t } = useTranslation();
  const online = status === "online";
  return (
    <Badge tone={online ? "success" : "neutral"} dot>
      {t(online ? "common.online" : "common.offline")}
    </Badge>
  );
}

function DeviceCard({
  device,
  onPatch,
  saving
}: {
  device: Device;
  onPatch: (patch: Partial<Device>) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={device.status} />
            {device.is_network_node && (
              <Badge tone="info">{t("deviceTypes.router")}</Badge>
            )}
          </div>
          <div className="mt-2 font-mono text-sm text-fg">{device.ip}</div>
          {device.mac && (
            <div className="font-mono text-xs text-subtle">{device.mac}</div>
          )}
        </div>
        <div className="text-right text-xs text-muted">
          <div>{formatRelative(device.last_seen, t)}</div>
          {saving && <div className="mt-1 text-brand">{t("common.loading")}</div>}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <label className="mb-1 block text-xs text-muted">
            {t("devices.table.name")}
          </label>
          <Input
            defaultValue={device.hostname ?? ""}
            onBlur={(e) => onPatch({ hostname: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">
            {t("devices.table.type")}
          </label>
          <Select
            value={device.device_type}
            onChange={(e) =>
              onPatch({ device_type: e.target.value as DeviceType })
            }
          >
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {t(deviceTypeI18nKey[type])}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">
            {t("topology.properties.notes")}
          </label>
          <Input
            defaultValue={device.notes ?? ""}
            onBlur={(e) => onPatch({ notes: e.target.value })}
          />
        </div>
        {device.vendor && (
          <div className="text-xs text-muted">
            {t("devices.table.vendor")}:{" "}
            <span className="text-fg">{device.vendor}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DeviceType | "all">("all");

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
      setDevices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } finally {
      setSaving(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices.filter((d) => {
      if (typeFilter !== "all" && d.device_type !== typeFilter) return false;
      if (!q) return true;
      return [d.ip, d.mac, d.hostname, d.vendor]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q));
    });
  }, [devices, query, typeFilter]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title={t("devices.title")}
          description={t("devices.subtitle")}
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("devices.filters.search") ?? ""}
              leadingIcon={<Search className="h-4 w-4" />}
            />
            <Select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as DeviceType | "all")
              }
            >
              <option value="all">{t("common.filterAll")}</option>
              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  {t(deviceTypeI18nKey[type])}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Signal className="h-5 w-5" />}
          title={t("devices.empty.title")}
          description={t("devices.empty.description")}
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                saving={saving === device.id}
                onPatch={(patch) => updateDevice(device, patch)}
              />
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle">
                    <th className="px-5 py-3 font-medium">
                      {t("devices.table.status")}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("devices.table.ip")}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("devices.table.name")}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("devices.table.mac")}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("devices.table.vendor")}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("devices.table.type")}
                    </th>
                    <th className="px-3 py-3 text-center font-medium">
                      <Router className="mx-auto h-3.5 w-3.5" />
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("topology.properties.notes")}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {t("devices.table.lastSeen")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((device) => (
                    <tr
                      key={device.id}
                      className={cn(
                        "border-b border-border/60 transition-colors hover:bg-bg-soft",
                        saving === device.id && "bg-brand/5"
                      )}
                    >
                      <td className="px-5 py-3">
                        <StatusPill status={device.status} />
                      </td>
                      <td className="px-3 py-3 font-mono text-fg">
                        {device.ip}
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          className="h-8 text-sm"
                          defaultValue={device.hostname ?? ""}
                          onBlur={(e) =>
                            updateDevice(device, { hostname: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted">
                        {device.mac || "—"}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {device.vendor || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Select
                          className="h-8 text-sm"
                          value={device.device_type}
                          onChange={(e) =>
                            updateDevice(device, {
                              device_type: e.target.value as DeviceType
                            })
                          }
                        >
                          {deviceTypes.map((type) => (
                            <option key={type} value={type}>
                              {t(deviceTypeI18nKey[type])}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-brand"
                          checked={device.is_network_node}
                          onChange={(e) =>
                            updateDevice(device, {
                              is_network_node: e.target.checked
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          className="h-8 text-sm"
                          defaultValue={device.notes ?? ""}
                          onBlur={(e) =>
                            updateDevice(device, { notes: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {formatRelative(device.last_seen, t)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
