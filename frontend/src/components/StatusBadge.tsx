import type { DeviceStatus } from "../types";

export default function StatusBadge({ status }: { status: DeviceStatus }) {
  const online = status === "online";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        online ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      {online ? "online" : "offline"}
    </span>
  );
}

