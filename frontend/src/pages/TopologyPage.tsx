import { type ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Connection,
  Edge,
  MiniMap,
  Node,
  NodeProps,
  Panel,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow
} from "reactflow";
import {
  Camera,
  Cpu,
  EyeOff,
  GitFork,
  HelpCircle,
  Info,
  Laptop,
  LayoutGrid,
  Maximize2,
  MousePointer2,
  Printer as PrintIcon,
  RefreshCw,
  Save,
  Server,
  Share2,
  Smartphone,
  Trash2,
  Wifi,
  X as CloseIcon,
  ZoomIn,
  ZoomOut,
  Printer
} from "lucide-react";
import { api } from "../api/client";
import type { Device, Topology } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type ConfigSummary = {
  offline_retention_days: number;
};

type TopologyNodeData = {
  device: Device;
  customLabel: string | null;
  icon: string | null;
  isNew: boolean;
  isUnclassified: boolean;
  isStale: boolean;
};

type TopologyEdgeData = {
  linkType: "ethernet" | "wifi" | "unknown";
  confirmed: boolean;
};

const NODE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  router: Wifi,
  switch: GitFork,
  access_point: Wifi,
  nas: Server,
  server: Server,
  pc: Laptop,
  phone: Smartphone,
  tablet: Smartphone,
  printer: Printer,
  camera: Camera,
  iot: Cpu,
  media: HelpCircle,
  unknown: HelpCircle
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatDeviceType(value: string) {
  return value.split("_").join(" ");
}

function resolveIcon(iconKey: string | null | undefined, deviceType: string) {
  return NODE_ICONS[iconKey ?? deviceType] ?? HelpCircle;
}

function buildNodeStyle(status: Device["status"], isStale: boolean) {
  return {
    opacity: status === "offline" ? (isStale ? 0.3 : 0.55) : 1,
    filter: status === "offline" && isStale ? "grayscale(100%)" : "none",
    background: "transparent",
    padding: 0
  };
}

function edgeStyle(linkType: TopologyEdgeData["linkType"], isConfirmed: boolean, selected: boolean) {
  const stroke = selected ? "#0f172a" : isConfirmed ? "#334155" : "#94a3b8";
  return {
    stroke,
    strokeWidth: selected ? 3 : 2.25,
    strokeLinecap: "round" as const,
    strokeDasharray: linkType === "wifi" ? "6 6" : "none",
    opacity: isConfirmed ? 1 : 0.9
  };
}

function TopologyNodeCard({ data, selected }: NodeProps<TopologyNodeData>) {
  const Icon = resolveIcon(data.icon, data.device.device_type);
  const title = data.customLabel || data.device.hostname || data.device.ip;
  const statusTone = data.device.status === "online" ? "text-emerald-600" : "text-rose-500";

  return (
    <div
      className={cn(
        "relative min-w-[250px] rounded-[18px] border bg-white/95 px-4 py-3 text-left shadow-[0_10px_25px_rgba(15,23,42,0.08)] backdrop-blur-sm transition",
        selected && "ring-2 ring-slate-900/10",
        data.isUnclassified && "bg-cyan-50/80",
        data.isStale && "bg-slate-100/90 grayscale"
      )}
    >
      {(data.isUnclassified || data.isStale) && (
        <div
          className={cn(
            "absolute -top-2 left-4 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
            data.isStale ? "bg-slate-200 text-slate-500" : "bg-cyan-100 text-cyan-700"
          )}
        >
          {data.isStale ? "Stale / Offline" : "New / Unclassified"}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
            selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-600",
            data.isUnclassified && "border-cyan-200 bg-cyan-50 text-cyan-700"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-slate-900">{title}</div>
          <div className="truncate font-mono text-[11px] text-slate-500">{data.device.ip}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {formatDeviceType(data.device.device_type)}
            </span>
            {data.device.is_network_node && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Network node
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span className={cn("font-semibold uppercase tracking-[0.16em]", statusTone)}>{data.device.status}</span>
        <span className="truncate">{data.device.vendor || "Unknown vendor"}</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  topologyNode: TopologyNodeCard
};

function FlowToolbar({ onReset }: { onReset: () => void }) {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();

  return (
    <Panel position="top-right" className="pointer-events-auto">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-soft backdrop-blur">
        <button
          type="button"
          title="Zoom out"
          onClick={() => zoomOut()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Zoom in"
          onClick={() => zoomIn()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Fit to screen"
          onClick={() => fitView({ padding: 0.18 })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Reset view"
          onClick={() => {
            setViewport({ x: 0, y: 0, zoom: 1 });
            onReset();
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  );
}

export default function TopologyPage() {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [config, setConfig] = useState<ConfigSummary | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TopologyEdgeData>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [data, configData] = await Promise.all([api.topology(), api.config()]);
    const now = Date.now();
    const retentionDays = configData.offline_retention_days;
    const latestSeen = data.nodes.reduce((max, node) => Math.max(max, Date.parse(node.device.last_seen)), 0);

    setTopology(data);
    setConfig(configData);
    setNodes(
      data.nodes.map((node): Node<TopologyNodeData> => {
        const offlineAge = now - Date.parse(node.device.last_seen);
        const isNew = Date.parse(node.device.first_seen) === latestSeen || Date.parse(node.device.last_seen) === latestSeen;
        const isUnclassified = node.x < 0;
        const isStale = node.device.status === "offline" && offlineAge > retentionDays * MS_PER_DAY;

        return {
          id: node.device_id,
          type: "topologyNode",
          position: { x: node.x, y: node.y },
          data: {
            device: node.device,
            customLabel: node.custom_label,
            icon: node.icon,
            isNew,
            isUnclassified,
            isStale
          },
          style: buildNodeStyle(node.device.status, isStale)
        };
      })
    );
    setEdges(
      data.edges.map((edge): Edge<TopologyEdgeData> => ({
        id: edge.id,
        source: edge.from_device_id,
        target: edge.to_device_id,
        animated: !edge.confirmed_by_user && edge.link_type === "unknown",
        label: edge.link_type === "unknown" ? (edge.confirmed_by_user ? "manual" : "auto") : edge.link_type,
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 9999,
        labelBgStyle: {
          fill: edge.confirmed_by_user ? "#e2e8f0" : "#f8fafc",
          stroke: "transparent"
        },
        labelStyle: {
          fill: edge.confirmed_by_user ? "#334155" : "#64748b",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.16em"
        },
        data: { linkType: edge.link_type, confirmed: edge.confirmed_by_user },
        style: edgeStyle(edge.link_type, edge.confirmed_by_user, false)
      }))
    );
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsDirty(false);
  }, [setEdges, setNodes]);

  useEffect(() => {
    load().catch((err) => setMessage(String(err)));
  }, [load]);

  useEffect(() => {
    setNodes((current) =>
      current.map((node): Node<TopologyNodeData> => {
        const selected = node.id === selectedNodeId;
        return {
          ...node,
          selected,
          style: buildNodeStyle(node.data.device.status, node.data.isStale)
        };
      })
    );

    setEdges((current) =>
      current.map((edge): Edge<TopologyEdgeData> => {
        const selected = edge.id === selectedEdgeId;
        const edgeData = edge.data ?? { linkType: "unknown", confirmed: false };
        return {
          ...edge,
          selected,
          data: edgeData,
          style: edgeStyle(edgeData.linkType, edgeData.confirmed, selected)
        };
      })
    );
  }, [selectedEdgeId, selectedNodeId, setEdges, setNodes]);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);
  const selectedEdgeData = selectedEdge?.data ?? { linkType: "unknown" as const, confirmed: false };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `manual-${connection.source}-${connection.target}-${Date.now()}`,
            label: "manual",
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 9999,
            labelBgStyle: {
              fill: "#e2e8f0",
              stroke: "transparent"
            },
            labelStyle: {
              fill: "#334155",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.16em"
            },
            data: { linkType: "unknown", confirmed: true },
            animated: false,
            style: edgeStyle("unknown", true, false)
          },
          current
        )
      );
      setIsDirty(true);
    },
    [setEdges]
  );

  const updateSelectedNode = useCallback(
    (updates: { customLabel?: string; icon?: string | null }) => {
      if (!selectedNodeId) return;
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== selectedNodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        })
      );
      setIsDirty(true);
    },
    [selectedNodeId, setNodes]
  );

  const updateSelectedEdge = useCallback(
    (linkType: TopologyEdgeData["linkType"]) => {
      if (!selectedEdgeId) return;
      setEdges((current) =>
        current.map((edge) => {
          if (edge.id !== selectedEdgeId) return edge;
          return {
            ...edge,
            label: linkType === "unknown" ? "manual" : linkType,
            data: { ...edge.data, linkType, confirmed: true },
            style: edgeStyle(linkType, true, true)
          };
        })
      );
      setIsDirty(true);
    },
    [selectedEdgeId, setEdges]
  );

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    setIsDirty(true);
  }, [selectedEdgeId, setEdges]);

  const save = async () => {
    if (!topology) return;

    const nodePayload = nodes.map((node) => {
      const existing = topology.nodes.find((item) => item.device_id === node.id);
      return {
        id: existing?.id,
        device_id: node.id,
        x: node.position.x,
        y: node.position.y,
        custom_label: node.data.customLabel ?? null,
        icon: node.data.icon ?? null,
        pinned: true
      };
    });

    const edgePayload = edges
      .filter((edge) => edge.source && edge.target)
      .map((edge) => ({
        from_device_id: edge.source,
        to_device_id: edge.target,
        link_type: edge.data?.linkType ?? "unknown",
        confidence: "manual",
        confirmed_by_user: true
      }));

    const saved = await api.saveTopology({ nodes: nodePayload, edges: edgePayload });
    setTopology(saved);
    setIsDirty(false);
    setMessage("Topology saved");
  };

  const reload = async () => {
    if (isDirty && !window.confirm("Discard unsaved topology changes and reload the latest scan data?")) {
      return;
    }
    await load();
    setMessage("Topology reloaded");
  };

  const counts = useMemo(
    () => ({
      nodes: nodes.length,
      edges: edges.length,
      online: nodes.filter((node) => node.data.device.status === "online").length,
      offline: nodes.filter((node) => node.data.device.status === "offline").length
    }),
    [edges.length, nodes]
  );

  const latestConfigLabel = config ? `${config.offline_retention_days} day offline retention` : "Loading settings";

  return (
    <div className="flex flex-col gap-4">
      {!isScreenshotMode && (
        <div className="rounded-[28px] bg-slate-950 px-6 py-6 text-white shadow-soft">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Topology editor
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Shape the map without losing the scan result.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Drag devices around, edit labels and icons, choose link types, and keep manual work intact while scans keep updating the
                network.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[460px]">
              {[
                ["Devices", counts.nodes],
                ["Links", counts.edges],
                ["Online", counts.online],
                ["Offline", counts.offline]
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{label as string}</p>
                  <p className="mt-2 text-2xl font-semibold">{value as number}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isScreenshotMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{latestConfigLabel}</span>
            <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700">Mouse wheel or toolbar to zoom</span>
            {isDirty && <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">Unsaved changes</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsScreenshotMode(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" />
              Screenshot / Share
            </button>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      )}

      {message && !isScreenshotMode && <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-800">{message}</div>}

      <div className={`grid gap-5 ${isScreenshotMode ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
        <div
          className={cn(
            "relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft",
            isScreenshotMode ? "h-[85vh]" : "h-[min(82vh,920px)]"
          )}
        >
          {isScreenshotMode && (
            <div className="absolute right-4 top-4 z-50 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 shadow-md backdrop-blur transition hover:bg-white"
              >
                <PrintIcon className="h-4 w-4" />
                Print view
              </button>
              <button
                type="button"
                onClick={() => setIsScreenshotMode(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-md backdrop-blur transition hover:bg-slate-900"
              >
                <EyeOff className="h-4 w-4" />
                Exit mode
              </button>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              if (isScreenshotMode) return;
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onNodeDragStop={() => setIsDirty(true)}
            onEdgeClick={(_, edge) => {
              if (isScreenshotMode) return;
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
            fitView
            minZoom={0.18}
            maxZoom={2.6}
            panOnScroll
            zoomOnScroll
            zoomOnDoubleClick={false}
          >
            <Background gap={28} size={1} color="#dbe2ea" />
            {!isScreenshotMode && (
              <>
                <MiniMap
                  nodeStrokeWidth={2}
                  zoomable
                  pannable
                  maskColor="rgba(248, 250, 252, 0.75)"
                  nodeColor={(node) => {
                    const data = node.data as TopologyNodeData | undefined;
                    if (!data) return "#94a3b8";
                    if (data.isStale) return "#94a3b8";
                    if (data.isUnclassified) return "#06b6d4";
                    if (data.device.status === "offline") return "#cbd5e1";
                    return "#0f172a";
                  }}
                />
                <FlowToolbar onReset={() => setMessage("View reset")} />
              </>
            )}
          </ReactFlow>
        </div>

        {!isScreenshotMode && (
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Properties</h3>
                <p className="text-sm text-slate-500">Edit the selected node or connection.</p>
              </div>
              {(selectedNodeId || selectedEdgeId) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                  }}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Node</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {selectedNode.data.customLabel || selectedNode.data.device.hostname || selectedNode.data.device.ip}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{selectedNode.data.device.vendor || "Unknown vendor"}</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom label</label>
                  <input
                    type="text"
                    value={selectedNode.data.customLabel || ""}
                    onChange={(event) => updateSelectedNode({ customLabel: event.target.value })}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                    placeholder="e.g. Living Room TV"
                  />
                  <p className="mt-2 text-xs text-slate-400">This label is saved with the topology and will survive reloads.</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Icon</label>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {Object.entries(NODE_ICONS).map(([key, Icon]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => updateSelectedNode({ icon: key })}
                        className={cn(
                          "flex h-12 items-center justify-center rounded-2xl border transition",
                          (selectedNode.data.icon || selectedNode.data.device.device_type) === key
                            ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Info className="h-4 w-4" />
                    <span>Device details</span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between gap-4">
                      <span>IP</span>
                      <span className="font-mono text-slate-700">{selectedNode.data.device.ip}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>MAC</span>
                      <span className="font-mono text-slate-700">{selectedNode.data.device.mac || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Status</span>
                      <span className={selectedNode.data.device.status === "online" ? "text-emerald-600" : "text-rose-600"}>
                        {selectedNode.data.device.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Link</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {selectedEdge.source}
                    {" -> "}
                    {selectedEdge.target}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{selectedEdgeData.linkType.toUpperCase()}</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Link type</label>
                  <div className="mt-3 grid gap-2">
                    {[
                      { id: "ethernet", label: "Ethernet", hint: "Solid line" },
                      { id: "wifi", label: "WiFi", hint: "Dashed line" },
                      { id: "unknown", label: "Unknown", hint: "Neutral" }
                    ].map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => updateSelectedEdge(type.id as TopologyEdgeData["linkType"])}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                          selectedEdgeData.linkType === type.id
                            ? "border-slate-950 bg-slate-950 text-white shadow-md"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs uppercase tracking-[0.18em] opacity-70">{type.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this link? The deletion will be saved when you click Save.")) {
                        deleteSelectedEdge();
                      }
                    }}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Link
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Info className="h-3.5 w-3.5" />
                    <span>Edge information</span>
                  </div>
                  <p className="mt-2 leading-6">
                    Solid strokes represent Ethernet. Dashed strokes represent WiFi. Unknown keeps the line neutral so later scans can still
                    refine it.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-400">
                <MousePointer2 className="mb-3 h-10 w-10 opacity-20" />
                <p>Select a node or a connection on the map to edit it.</p>
                <p className="mt-2 text-xs text-slate-400">Drag the map, use the zoom controls, or open screenshot mode for a clean share view.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!isScreenshotMode && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{counts.nodes} nodes</span>
          <span>•</span>
          <span>{counts.edges} links</span>
          <span>•</span>
          <span>{selectedNode ? "Node selected" : selectedEdge ? "Link selected" : "Nothing selected"}</span>
        </div>
      )}
    </div>
  );
}
