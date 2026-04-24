import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Camera,
  Cpu,
  HelpCircle,
  Laptop,
  Printer,
  Router,
  Server,
  Smartphone,
  Tv,
  Wifi
} from "lucide-react";
import type { Device } from "../types";
import { cn } from "../lib/cn";

export const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  router:       Router,
  switch:       Router,
  access_point: Wifi,
  server:       Server,
  nas:          Server,
  pc:           Laptop,
  phone:        Smartphone,
  tablet:       Smartphone,
  printer:      Printer,
  camera:       Camera,
  iot:          Cpu,
  media:        Tv,
  unknown:      HelpCircle
};

export interface TopologyNodeData {
  device: Device;
  customLabel: string | null;
  icon: string | null;
  isNew: boolean;
  isUnclassified: boolean;
  isStale: boolean;
  isNetworkNode?: boolean;
}

function TopologyNodeInner({
  data,
  selected
}: NodeProps<TopologyNodeData>) {
  const { device, customLabel, icon, isNew, isUnclassified, isStale } = data;
  const online = device.status === "online";
  const Icon = NODE_ICONS[icon || device.device_type] || NODE_ICONS.unknown;
  const title = customLabel || device.hostname || device.ip;

  const ringTone = online ? "ring-success/40" : isStale ? "ring-border" : "ring-subtle/40";

  return (
    <div
      className={cn(
        "relative min-w-[200px] rounded-2xl border bg-surface px-3 py-3 text-left shadow-soft transition-all",
        "border-border text-fg",
        selected && "border-brand ring-2 ring-brand/30",
        !online && !isStale && "opacity-75",
        isStale && "opacity-40 grayscale",
        isUnclassified && !selected && "border-info/50 bg-info/5",
        isNew && !selected && !isUnclassified && "border-brand/50 bg-brand/5"
      )}
    >
      {(isUnclassified || isNew) && !isStale && (
        <div
          className={cn(
            "absolute -top-2.5 left-3 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            isUnclassified
              ? "border-info/40 bg-info/10 text-info"
              : "border-brand/40 bg-brand/10 text-brand"
          )}
        >
          {isUnclassified ? "NEW" : "NEW"}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-surface !bg-brand"
      />

      <div className="flex items-center gap-3">
        {/* icon with status ring */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-soft">
          <Icon className="h-5 w-5 text-muted" />
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2",
              online
                ? "bg-success ring-success/30"
                : isStale
                  ? "bg-subtle ring-border"
                  : "bg-muted ring-muted/30",
              ringTone
            )}
          />
          {online && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse-ring rounded-full bg-success"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-fg">{title}</div>
          <div className="truncate font-mono text-[11px] text-subtle">{device.ip}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-surface !bg-brand"
      />
    </div>
  );
}

export const TopologyNode = memo(TopologyNodeInner);
