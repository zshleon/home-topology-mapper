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
import { Save, RefreshCw, Server, Smartphone, Laptop, Printer, Wifi, Cpu, Camera, HelpCircle, X as CloseIcon } from "lucide-react";
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

function nodeStyle(status: string, isNew: boolean, isSelected: boolean) {
  const base = status === "offline" 
    ? { opacity: 0.45 } 
    : { opacity: 1 };

  return {
    ...base,
    border: isSelected 
      ? "2px solid #0f172a" 
      : isNew ? "2px solid #06b6d4" : "1px solid #dbe2ea",
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: isSelected ? "0 0 0 2px rgba(15, 23, 42, 0.1)" : "none",
    padding: 0,
  };
}

export default function TopologyPage() {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId), 
    [nodes, selectedNodeId]
  );

  const load = useCallback(async () => {
    const data = await api.topology();
    setTopology(data);
    const latestSeen = data.nodes.reduce((max: number, node) => Math.max(max, Date.parse(node.device.last_seen)), 0);
    const flowNodes: Node[] = data.nodes.map((node) => {
      const isNew = Date.parse(node.device.first_seen) === latestSeen || Date.parse(node.device.last_seen) === latestSeen;
      const Icon = ICONS[node.icon || node.device.device_type] || ICONS.unknown;

      const title = node.custom_label || node.device.hostname || node.device.ip;
      return {
        id: node.device_id,
        position: { x: node.x, y: node.y },
        selected: node.device_id === selectedNodeId,
        data: {
          device: node.device,
          customLabel: node.custom_label,
          icon: node.icon,
          label: (
            <div className="relative flex items-center gap-3 min-w-[180px] p-3 text-left">
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
        style: nodeStyle(node.device.status, isNew, node.device_id === selectedNodeId)
      };
    });
    const flowEdges: Edge[] = data.edges.map((edge: any) => ({
      id: edge.id,
      source: edge.from_device_id,
      target: edge.to_device_id,
      animated: !edge.confirmed_by_user,
      label: edge.confirmed_by_user ? "manual" : "auto",
      style: { stroke: edge.confirmed_by_user ? "#111827" : "#94a3b8" }
    }));
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setEdges, setNodes]);

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
            animated: false,
            style: { stroke: "#111827" }
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
        link_type: "unknown",
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
        style: nodeStyle(n.data.device.status, false, true)
      };
    }));
  };

  const counts = useMemo(() => ({ nodes: nodes.length, edges: edges.length }), [edges.length, nodes.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Topology</h2>
          <p className="text-sm text-slate-500">Drag nodes, connect devices, and save the layout. Manual edges are preserved across scans.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-soft">
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
          <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-white shadow-soft">
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
      {message && <div className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">{message}</div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="relative h-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setNodes(nds => nds.map(n => ({
                ...n,
                selected: n.id === node.id,
                style: nodeStyle(n.data.device.status, false, n.id === node.id)
              })));
            }}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setNodes(nds => nds.map(n => ({
                ...n,
                selected: false,
                style: nodeStyle(n.data.device.status, false, false)
              })));
            }}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-lg">Node Properties</h3>
            {selectedNodeId && (
              <button onClick={() => setSelectedNodeId(null)} className="p-1 hover:bg-slate-100 rounded">
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
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 text-sm text-center px-4">
              <Cpu className="h-10 w-10 mb-3 opacity-20" />
              <p>Select a node on the map to edit its label and icon.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500">{counts.nodes} nodes, {counts.edges} links</p>
    </div>
  );
}
