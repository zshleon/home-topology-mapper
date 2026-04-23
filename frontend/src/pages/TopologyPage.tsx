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
import { Save, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import type { Topology } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function nodeStyle(status: string, isNew: boolean, isUnclassified: boolean, isStale: boolean) {
  if (status === "offline") {
    return { 
      opacity: isStale ? 0.25 : 0.45, 
      border: isStale ? "1px dashed #94a3b8" : "1px solid #cbd5e1", 
      background: isStale ? "#f1f5f9" : "#f8fafc",
      filter: isStale ? "grayscale(100%)" : "none",
    };
  }
  if (isUnclassified) {
    return { 
      border: "2px dashed #0891b2", 
      background: "#ecfeff",
      borderRadius: "12px",
    };
  }
  if (isNew) {
    return { border: "2px solid #06b6d4", background: "#ecfeff" };
  }
  return { border: "1px solid #dbe2ea", background: "#ffffff" };
}

export default function TopologyPage() {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [config, setConfig] = useState<{ offline_retention_days: number } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Note: api.config() is expected to be available from the offline-device-policy branch logic
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

      const title = node.custom_label || node.device.hostname || node.device.ip;
      return {
        id: node.device_id,
        position: { x: node.x, y: node.y },
        data: {
          label: (
            <div className="relative min-w-[150px] p-1">
              {(isUnclassified || isStale) && (
                <div className={`absolute -top-6 left-0 text-[10px] font-bold uppercase ${isStale ? "text-slate-400" : "text-cyan-600"}`}>
                  {isStale ? "Stale / Offline" : "New / Unclassified"}
                </div>
              )}
              <div className="font-semibold">{title}</div>
              <div className="font-mono text-xs text-slate-500">{node.device.ip}</div>
              <div className="mt-1 text-xs text-slate-500 uppercase">{node.device.device_type}</div>
            </div>
          )
        },
        style: nodeStyle(node.device.status, isNew, isUnclassified, isStale)
      };
    });
    
    const flowEdges: Edge[] = data.edges.map((edge) => ({
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
        custom_label: existing?.custom_label ?? null,
        icon: existing?.icon ?? null,
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
      <div className="h-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <p className="text-sm text-slate-500">{counts.nodes} nodes, {counts.edges} links</p>
    </div>
  );
}
