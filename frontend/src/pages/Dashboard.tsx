import { useEffect, useMemo, useState } from "react";
import { GitFork, Radar, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import type { Device, ScanRecord } from "../types";

interface DashboardProps {
  onOpenTopology: () => void;
}

export default function Dashboard({ onOpenTopology }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [subnet, setSubnet] = useState("");
  const [mode, setMode] = useState("quick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const [deviceData, scanData] = await Promise.all([api.devices(), api.scans()]);
    setDevices(deviceData);
    setScans(scanData);
  };

  useEffect(() => {
    refresh().catch((err) => setError(String(err)));
  }, []);

  const stats = useMemo(() => {
    const online = devices.filter((device) => device.status === "online").length;
    const offline = devices.length - online;
    const network = devices.filter((device) => device.is_network_node).length;
    return { online, offline, network, total: devices.length };
  }, [devices]);

  const startScan = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.startScan({ subnet: subnet || undefined, mode });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-slate-950 p-8 text-white shadow-soft">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">MVP workspace</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Map your home network without turning it into a job.</h2>
          <p className="mt-4 text-slate-300">
            Scan your LAN, get a first topology draft, then drag nodes and confirm links by hand.
            Manual topology always wins over future scans.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total devices", stats.total],
          ["Online", stats.online],
          ["Offline", stats.offline],
          ["Network nodes", stats.network]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-3">
            <Radar className="h-5 w-5 text-slate-700" />
            <h3 className="text-lg font-semibold">Start a scan</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
            <input
              value={subnet}
              onChange={(event) => setSubnet(event.target.value)}
              placeholder="192.168.1.0/24"
              className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-500"
            />
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="quick">quick</option>
              <option value="full">full</option>
            </select>
            <button
              onClick={startScan}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Scanning" : "Scan"}
            </button>
          </div>
          {error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent scans</h3>
            <button onClick={onOpenTopology} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <GitFork className="h-4 w-4" />
              Open topology
            </button>
          </div>
          <div className="space-y-3">
            {scans.slice(0, 4).map((scan) => (
              <div key={scan.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium">{scan.subnet}</p>
                <p className="text-sm text-slate-500 whitespace-pre-line">{scan.result_summary || scan.error || "No summary yet"}</p>
                {scan.error_hint && <p className="mt-1 text-xs text-slate-400 whitespace-pre-line">{scan.error_hint}</p>}
              </div>
            ))}
            {scans.length === 0 && <p className="text-sm text-slate-500">No scans yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
