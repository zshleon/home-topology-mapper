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
import { Save, RefreshCw, Share2, Eye, EyeOff, Printer as PrintIcon } from "lucide-react";
import { api } from "../api/client";
import type { Topology } from "../types";

function nodeStyle(status: string, isNew: boolean) {
  if (status === "offline") {
    return { opacity: 0.45, border: "1px solid #cbd5e1", background: "#f8fafc" };
  }
  if (isNew) {
    return { border: "2px solid #06b6d4", background: "#ecfeff" };
  }
  return { border: "1px solid #dbe2ea", background: "#ffffff" };
}

export default function TopologyPage() {
  const [topology, setTopology] = useState<Topology | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.topology();
    setTopology(data);
    const latestSeen = data.nodes.reduce((max: number, node) => Math.max(max, Date.parse(node.device.last_seen)), 0);
    const flowNodes: Node[] = data.nodes.map((node) => {
      const isNew = Date.parse(node.device.first_seen) === latestSeen || Date.parse(node.device.last_seen) === latestSeen;
      const title = node.custom_label || node.device.hostname || node.device.ip;
      return {
        id: node.device_id,
        position: { x: node.x, y: node.y },
        data: {
          label: (
            <div className="min-w-[150px]">
              <div className="font-semibold">{title}</div>
              <div className="font-mono text-xs text-slate-500">{node.device.ip}</div>
              <div className="mt-1 text-xs text-slate-500">{node.device.device_type}</div>
            </div>
          )
        },
        style: nodeStyle(node.device.status, isNew)
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
          {!isScreenshotMode && (
            <>
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
            </>
          )}
          {isScreenshotMode && (
            <>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-soft hover:bg-slate-50">
                <PrintIcon className="h-4 w-4" />
                Print View
              </button>
              <button onClick={() => setIsScreenshotMode(false)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white shadow-soft">
                <EyeOff className="h-4 w-4" />
                Exit Mode
              </button>
            </>
          )}
        </div>
      </div>
      {message && !isScreenshotMode && <div className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-800">{message}</div>}
      <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft ${isScreenshotMode ? "h-[85vh]" : "h-[720px]"}`}>
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
      {!isScreenshotMode && <p className="text-sm text-slate-500">{counts.nodes} nodes, {counts.edges} links</p>}
    </div>
  );
}
