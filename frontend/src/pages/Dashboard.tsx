import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  GitFork,
  Gauge,
  History,
  Radar,
  RefreshCw,
  Router,
  Wifi,
  WifiOff
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { Device, ScanRecord } from "../types";
import { BrandMark } from "../components/Brand";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { StatCard } from "../components/ui/StatCard";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { formatRelative } from "../utils/time";
import { cn } from "../lib/cn";

interface DashboardProps {
  onOpenTopology: () => void;
}

interface DiagCheck {
  id: string;
  name: string;
  status: "ok" | "warn" | "error";
  message?: string;
  hint?: string;
}

export default function Dashboard({ onOpenTopology }: DashboardProps) {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [subnet, setSubnet] = useState("");
  const [mode, setMode] = useState("quick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(
    null
  );
  const [diagnostics, setDiagnostics] = useState<{ checks: DiagCheck[] } | null>(
    null
  );

  const refresh = async () => {
    const [deviceData, scanData, diagData] = await Promise.all([
      api.devices(),
      api.scans(),
      api.diagnostics().catch(() => null)
    ]);
    setDevices(deviceData);
    setScans(scanData);
    setDiagnostics(diagData as { checks: DiagCheck[] } | null);
  };

  useEffect(() => {
    refresh().catch((err) =>
      setError({
        message:
          err instanceof Error ? err.message : t("errors.loadDevices")
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const online = devices.filter((d) => d.status === "online").length;
    const offline = devices.length - online;
    const network = devices.filter((d) => d.is_network_node).length;
    return { online, offline, network, total: devices.length };
  }, [devices]);

  const startScan = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.startScan({ subnet: subnet || undefined, mode });
      await refresh();
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : String(err),
        hint: (err as Error & { hint?: string }).hint
      });
    } finally {
      setLoading(false);
    }
  };

  const errorChecks = (diagnostics?.checks ?? []).filter(
    (c) => c.status === "error"
  );
  const lastScan = scans[0];

  return (
    <div className="space-y-6">
      {/* --- Hero --------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand/90 to-info p-8 text-white shadow-soft">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            <span className="tracking-wider">Home Topology Mapper · self-hosted</span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("dashboard.heroTitle")}
          </h2>
          <p className="mt-4 text-white/85">
            {t("dashboard.heroSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                document
                  .getElementById("scan-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-brand hover:bg-white/90"
            >
              <Radar className="h-4 w-4" />
              {t("dashboard.cta")}
            </button>
            <button
              onClick={onOpenTopology}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
            >
              <GitFork className="h-4 w-4" />
              {t("nav.topology")}
            </button>
          </div>
        </div>
        {/* decorative glyph */}
        <div className="pointer-events-none absolute -right-6 -top-6 text-white/30">
          <BrandMark size={240} />
        </div>
      </section>

      {/* --- Diagnostics ------------------------------------------- */}
      {errorChecks.length > 0 && (
        <Alert tone="danger" title={t("dashboard.diagnostics.warn")}>
          <ul className="mt-1 space-y-2">
            {errorChecks.map((check) => (
              <li key={check.id} className="text-sm">
                <span className="font-medium">{check.name}</span>
                {check.message && <> — {check.message}</>}
                {check.hint && (
                  <div className="mt-1 rounded-md bg-danger/10 p-2 font-mono text-xs text-danger">
                    {check.hint}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* --- Stats grid -------------------------------------------- */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.stats.total")}
          value={stats.total}
          hint={t("dashboard.stats.totalHint")}
          icon={<Gauge className="h-4 w-4" />}
          tone="brand"
        />
        <StatCard
          label={t("dashboard.stats.online")}
          value={stats.online}
          hint={t("dashboard.stats.onlineHint")}
          icon={<Wifi className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label={t("dashboard.stats.offline")}
          value={stats.offline}
          hint={t("dashboard.stats.offlineHint")}
          icon={<WifiOff className="h-4 w-4" />}
          tone={stats.offline === 0 ? "neutral" : "warn"}
        />
        <StatCard
          label={t("dashboard.stats.nodes")}
          value={stats.network}
          hint={t("dashboard.stats.nodesHint")}
          icon={<Router className="h-4 w-4" />}
          tone="info"
        />
      </section>

      {/* --- Scan form + history ----------------------------------- */}
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card id="scan-form">
          <CardHeader
            title={t("dashboard.scan.title")}
            description={t("dashboard.scan.description")}
            actions={
              lastScan && (
                <span className="text-xs text-muted">
                  {t("dashboard.scan.lastRun")}:{" "}
                  {formatRelative(lastScan.started_at, t)}
                </span>
              )
            }
          />
          <CardBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  {t("dashboard.scan.subnets")}
                </label>
                <Input
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                  placeholder={t("dashboard.scan.subnetsPlaceholder") ?? ""}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  {t("dashboard.scan.mode")}
                </label>
                <Select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="quick">{t("dashboard.scan.modeQuick")}</option>
                  <option value="full">{t("dashboard.scan.modeFull")}</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={startScan}
                  disabled={loading}
                  className="w-full"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                  {loading
                    ? t("dashboard.scan.running")
                    : t("dashboard.scan.start")}
                </Button>
              </div>
            </div>
            {error && (
              <Alert tone="danger" title={error.message}>
                {error.hint && (
                  <p className="text-sm">
                    <span className="font-medium">Hint:</span> {error.hint}
                  </p>
                )}
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t("dashboard.history.title")}
            description={t("dashboard.history.description")}
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenTopology}
              >
                <GitFork className="h-4 w-4" />
                {t("nav.topology")}
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {scans.length === 0 ? (
              <EmptyState
                icon={<History className="h-5 w-5" />}
                title={t("dashboard.history.empty")}
              />
            ) : (
              scans.slice(0, 10).map((scan) => {
                const failed = Boolean(scan.error);
                const tone = failed
                  ? "danger"
                  : scan.online_count > 0
                    ? "success"
                    : "neutral";
                return (
                  <div
                    key={scan.id}
                    className={cn(
                      "rounded-xl border border-border bg-surface px-4 py-3",
                      failed && "border-danger/30 bg-danger/5"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-fg">
                        {scan.subnet}
                        <Badge tone={scan.scan_mode === "full" ? "info" : "neutral"}>
                          {scan.scan_mode}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Badge tone={tone} dot>
                          {failed
                            ? t("status.down")
                            : t("dashboard.history.devicesFound", {
                                count: scan.discovered_count
                              })}
                        </Badge>
                        <span>{formatRelative(scan.started_at, t)}</span>
                      </div>
                    </div>
                    {scan.result_summary && !failed && (
                      <p className="mt-1 whitespace-pre-line text-xs text-muted">
                        {scan.result_summary}
                      </p>
                    )}
                    {failed && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-danger">
                          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                          {scan.error}
                        </p>
                        {scan.error_hint && (
                          <p className="text-xs italic text-muted">
                            Hint: {scan.error_hint}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
