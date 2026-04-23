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
import { Save, RefreshCw, Wifi, Share2, MousePointer2 } from "lucide-react";
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedEdge = useMemo(() => 
    edges.find(e => e.id === selectedEdgeId), 
    [edges, selectedEdgeId]
  );

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
      animated: !edge.confirmed_by_user && edge.link_type === "unknown",
      label: edge.link_type !== "unknown" ? edge.link_type : (edge.confirmed_by_user ? "manual" : "auto"),
      data: { linkType: edge.link_type, confirmed: edge.confirmed_by_user },
      style: edgeStyle(edge.link_type, edge.confirmed_by_user, false)
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
        link_type: edge.data?.linkType || "unknown",
        confidence: "manual",
        confirmed_by_user: true
      }));
    const saved = await api.saveTopology({ nodes: nodePayload, edges: edgePayload });
    setTopology(saved);
    setMessage("Topology saved");
    await load();
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
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setEdges(eds => eds.map(e => ({
                ...e,
                style: edgeStyle(e.data?.linkType || "unknown", e.data?.confirmed || false, e.id === edge.id)
              })));
            }}
            onPaneClick={() => {
              setSelectedEdgeId(null);
              setEdges(eds => eds.map(e => ({
                ...e,
                style: edgeStyle(e.data?.linkType || "unknown", e.data?.confirmed || false, false)
              })));
            }}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="font-semibold text-slate-700 text-lg mb-4">Properties</h3>
          
          {selectedEdge ? (
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

              <div className="pt-6 border-t border-slate-100">
                <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
                  <div className="flex items-center gap-2 mb-2 font-semibold text-slate-700">
                    <Wifi className="h-3.5 w-3.5" />
                    <span>Visual Legend</span>
                  </div>
                  <p>Solid lines represent Ethernet connections. Dashed lines represent WiFi connections.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 text-sm text-center px-6">
              <Share2 className="h-10 w-10 mb-4 opacity-20" />
              <p>Select a connection line on the map to change its link type.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500">{counts.nodes} nodes, {counts.edges} links</p>
    </div>
  );
}
