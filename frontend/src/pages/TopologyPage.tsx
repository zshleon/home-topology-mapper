import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  Node,
  addEdge,
  useEdgesState,
  useNodesState
} from "reactflow";
import { Save, RefreshCw, Server, Smartphone, Laptop, Printer, Wifi, Cpu, Camera, HelpCircle, X as CloseIcon, Share2, MousePointer2, Trash2, Info, EyeOff, Printer as PrintIcon } from "lucide-react";
import { api } from "../api/client";
import type { Topology } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ICONS: Record<string, any> = {
  router: Wifi,
  server: Server,
  phone: Smartphone,
  pc: Laptop,
  printer: Printer,
  iot: Cpu,
  camera: Camera,
  unknown: HelpCircle
};

function nodeStyle(status: string, isNew: boolean, isUnclassified: boolean, isStale: boolean, isSelected: boolean) {
  const baseShadow = isSelected ? "0 0 0 2px rgba(15, 23, 42, 0.1)" : "none";
  const baseBorder = isSelected ? "2px solid #0f172a" : null;

  if (status === "offline") {
    return { 
      opacity: isStale ? 0.25 : 0.45, 
      border: baseBorder || (isStale ? "1px dashed #94a3b8" : "1px solid #cbd5e1"), 
      background: isStale ? "#f1f5f9" : "#f8fafc",
      filter: isStale ? "grayscale(100%)" : "none",
      boxShadow: baseShadow,
      borderRadius: "8px",
      padding: 0,
    };
  }
  if (isUnclassified) {
    return { 
      border: baseBorder || "2px dashed #0891b2", 
      background: "#ecfeff",
      borderRadius: "12px",
      boxShadow: baseShadow,
      padding: 0,
    };
  }
  if (isNew) {
    return { 
      border: baseBorder || "2px solid #06b6d4", 
      background: "#ecfeff",
      borderRadius: "8px",
      boxShadow: baseShadow,
      padding: 0,
    };
  }
  return { 
    border: baseBorder || "1px solid #dbe2ea", 
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: baseShadow,
    padding: 0,
  };
}

function edgeStyle(linkType: string, isConfirmed: boolean, isSelected: boolean) {
  const stroke = isSelected ? "#0f172a" : isConfirmed ? "#1e293b" : "#94a3b8";
  return {
    stroke,
    strokeWidth: isSelected ? 3 : 2,
    strokeDasharray: linkType === "wifi" ? "5,5" : "none",
  };
}

export default function TopologyPage() {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [config, setConfig] = useState<{ offline_retention_days: number } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId), 
    [nodes, selectedNodeId]
  );
  
  const selectedEdge = useMemo(() => 
    edges.find(e => e.id === selectedEdgeId), 
    [edges, selectedEdgeId]
  );

  const load = useCallback(async () => {
    const [data, configData] = await Promise.all([
      api.topology(), 
      (api as any).config ? (api as any).config() : Promise.resolve({ offline_retention_days: 30 })
    ]);
    setTopology(data);
    setConfig(configData);
    
    const now = Date.now();
    const retentionDays = configData.offline_retention_days;
    const latestSeen = data.nodes.reduce((max, node) => Math.max(max, Date.parse(node.device.last_seen)), 0);
    
    const flowNodes: Node[] = data.nodes.map((node) => {
      const isNew = Date.parse(node.device.first_seen) === latestSeen || Date.parse(node.device.last_seen) === latestSeen;
      const isUnclassified = node.x < -100;
      const offlineAge = now - Date.parse(node.device.last_seen);
      const isStale = node.device.status === "offline" && offlineAge > (retentionDays * MS_PER_DAY);
      const isSelected = node.device_id === selectedNodeId;
      const Icon = ICONS[node.icon || node.device.device_type] || ICONS.unknown;
      const title = node.custom_label || node.device.hostname || node.device.ip;

      return {
        id: node.device_id,
        position: { x: node.x, y: node.y },
        selected: isSelected,
        data: {
          device: node.device,
          customLabel: node.custom_label,
          icon: node.icon,
          isNew,
          isUnclassified,
          isStale,
          label: (
            <div className="relative flex items-center gap-3 min-w-[180px] p-3 text-left">
              {(isUnclassified || isStale) && (
                <div className={`absolute -top-6 left-0 text-[10px] font-bold uppercase ${isStale ? "text-slate-400" : "text-cyan-600"}`}>
                  {isStale ? "Stale / Offline" : "New / Unclassified"}
                </div>
              )}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-semibold">{title}</div>
                <div className="truncate font-mono text-[10px] text-slate-400">{node.device.ip}</div>
              </div>
            </div>
          )
        },
        style: nodeStyle(node.device.status, isNew, isUnclassified, isStale, isSelected)
      };
    });
    
    const flowEdges: Edge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: edge.from_device_id,
      target: edge.to_device_id,
      animated: !edge.confirmed_by_user && edge.link_type === "unknown",
      label: edge.link_type !== "unknown" ? edge.link_type : (edge.confirmed_by_user ? "manual" : "auto"),
      data: { linkType: edge.link_type, confirmed: edge.confirmed_by_user },
      style: edgeStyle(edge.link_type, edge.confirmed_by_user, edge.id === selectedEdgeId)
    }));
    
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setEdges, setNodes, selectedNodeId, selectedEdgeId]);

  useEffect(() => {
    load().catch((err) => setMessage(String(err)));
  }, [load]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `manual-${connection.source}-${connection.target}-${Date.now()}`,
            label: "manual",
            data: { linkType: "unknown", confirmed: true },
            animated: false,
            style: edgeStyle("unknown", true, false)
          },
          current
        )
      );
    },
    [setEdges]
  );

  const save = async () => {
    if (!topology) return;
    const nodePayload = nodes.map((node) => {
      const existing = topology.nodes.find((item) => item.device_id === node.id);
      return {
        id: existing?.id,
        device_id: node.id,
        x: node.position.x,
        y: node.position.y,
        custom_label: node.data.customLabel,
        icon: node.data.icon,
        pinned: true
      };
    });
    const edgePayload = edges
      .filter((edge) => edge.source && edge.target)
      .map((edge) => ({
        from_device_id: edge.source,
        to_device_id: edge.target,
        link_type: edge.data?.linkType || "unknown",
        confidence: "manual",
        confirmed_by_user: true
      }));
    const saved = await api.saveTopology({ nodes: nodePayload, edges: edgePayload });
    setTopology(saved);
    setMessage("Topology saved");
    await load();
  };

  const updateSelectedNode = (updates: { customLabel?: string; icon?: string }) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const nextData = { ...n.data, ...updates };
      const Icon = ICONS[nextData.icon || nextData.device.device_type] || ICONS.unknown;
      const title = nextData.customLabel || nextData.device.hostname || nextData.device.ip;
      
      return {
        ...n,
        data: {
          ...nextData,
          label: (
            <div className="relative flex items-center gap-3 min-w-[180px] p-3 text-left">
              {(n.data.isUnclassified || n.data.isStale) && (
                <div className={`absolute -top-6 left-0 text-[10px] font-bold uppercase ${n.data.isStale ? "text-slate-400" : "text-cyan-600"}`}>
                  {n.data.isStale ? "Stale / Offline" : "New / Unclassified"}
                </div>
              )}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-semibold">{title}</div>
                <div className="truncate font-mono text-[10px] text-slate-400">{nextData.device.ip}</div>
              </div>
            </div>
          )
        },
        style: nodeStyle(n.data.device.status, n.data.isNew, n.data.isUnclassified, n.data.isStale, true)
      };
    }));
  };
  
  const updateSelectedEdge = (linkType: string) => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.map((e) => {
      if (e.id !== selectedEdgeId) return e;
      return {
        ...e,
        label: linkType !== "unknown" ? linkType : "manual",
        data: { ...e.data, linkType },
        style: edgeStyle(linkType, e.data?.confirmed || true, true)
      };
    }));
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges(eds => eds.filter(e => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const counts = useMemo(() => ({ nodes: nodes.length, edges: edges.length }), [edges.length, nodes.length]);

  return (
    <div className="space-y-4">
      {!isScreenshotMode && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Topology</h2>
            <p className="text-sm text-slate-500">Drag nodes, connect devices, and save the layout.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsScreenshotMode(true)} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-soft hover:bg-slate-50">
              <Share2 className="h-4 w-4" />
              Screenshot / Share
            </button>
            <button onClick={() => load()} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-soft hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
            <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-white shadow-soft">
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      )}
      
      {message && !isScreenshotMode && <div className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">{message}</div>}
      
      <div className={`grid gap-5 ${isScreenshotMode ? "grid-cols-1" : "lg:grid-cols-[1fr_300px]"}`}>
        <div className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft ${isScreenshotMode ? "h-[85vh]" : "h-[720px]"}`}>
          {isScreenshotMode && (
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <button onClick={() => window.print()} className="rounded-lg bg-white/90 px-4 py-2 text-slate-900 shadow-md backdrop-blur hover:bg-white">
                <PrintIcon className="h-4 w-4 inline mr-2" />
                Print
              </button>
              <button onClick={() => setIsScreenshotMode(false)} className="rounded-lg bg-slate-900/90 px-4 py-2 text-white shadow-md backdrop-blur hover:bg-slate-900">
                <EyeOff className="h-4 w-4 inline mr-2" />
                Exit Mode
              </button>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              if (isScreenshotMode) return;
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
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
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {!isScreenshotMode && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 text-lg">Properties</h3>
              {(selectedNodeId || selectedEdgeId) && (
                <button onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }} className="p-1 hover:bg-slate-100 rounded">
                  <CloseIcon className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
            
            {selectedNode ? (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Label</label>
                  <input 
                    type="text"
                    value={selectedNode.data.customLabel || ""}
                    onChange={(e) => updateSelectedNode({ customLabel: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-500"
                    placeholder="e.g. Living Room TV"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Icon</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {Object.entries(ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        onClick={() => updateSelectedNode({ icon: key })}
                        className={`flex h-10 items-center justify-center rounded-lg border ${
                          (selectedNode.data.icon || selectedNode.data.device.device_type) === key
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="text-xs text-slate-400">
                    <div className="flex justify-between py-1">
                      <span>IP Address</span>
                      <span className="font-mono">{selectedNode.data.device.ip}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>MAC</span>
                      <span className="font-mono text-[9px] uppercase">{selectedNode.data.device.mac || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Status</span>
                      <span className={selectedNode.data.device.status === "online" ? "text-emerald-600" : "text-rose-600"}>
                        {selectedNode.data.device.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Link Type</label>
                  <div className="mt-3 grid gap-2">
                    {[
                      { id: "ethernet", label: "Ethernet (Wired)" },
                      { id: "wifi", label: "WiFi (Wireless)" },
                      { id: "unknown", label: "Unknown / Legacy" }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => updateSelectedEdge(type.id)}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all ${
                          selectedEdge.data?.linkType === type.id
                            ? "border-slate-950 bg-slate-950 text-white shadow-md"
                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                        }`}
                      >
                        <span>{type.label}</span>
                        {selectedEdge.data?.linkType === type.id && <MousePointer2 className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions</label>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this link?")) {
                          deleteSelectedEdge();
                        }
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Link
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 font-semibold text-slate-700">
                      <Info className="h-3.5 w-3.5" />
                      <span>Edge Information</span>
                    </div>
                    <p>Solid lines represent Ethernet. Dashed represent WiFi. Deleting a link will be permanent after saving.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 text-sm text-center px-4">
                <Share2 className="h-10 w-10 mb-3 opacity-20" />
                <p>Select a node or connection line on the map to edit its properties.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {!isScreenshotMode && <p className="text-sm text-slate-500">{counts.nodes} nodes, {counts.edges} links</p>}
    </div>
  );
}
