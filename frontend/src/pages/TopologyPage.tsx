import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  addEdge,
  useEdgesState,
  useNodesState
} from "reactflow";
import {
  Info,
  MousePointer2,
  Printer as PrintIcon,
  RefreshCw,
  Save,
  Share2,
  Trash2,
  X as CloseIcon,
  EyeOff
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { Topology } from "../types";
import {
  NODE_ICONS,
  TopologyNode,
  type TopologyNodeData
} from "../components/TopologyNode";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Alert } from "../components/ui/Alert";
import { cn } from "../lib/cn";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const nodeTypes: NodeTypes = { device: TopologyNode };

function edgeStyle(linkType: string, isSelected: boolean) {
  const stroke = isSelected
    ? "rgb(var(--brand))"
    : linkType === "wifi"
      ? "rgb(var(--info))"
      : "rgb(var(--muted))";
  return {
    stroke,
    strokeWidth: isSelected ? 2.5 : 1.8,
    strokeDasharray: linkType === "wifi" ? "6,4" : undefined
  };
}

export default function TopologyPage() {
  const { t } = useTranslation();
  const [topology, setTopology] = useState<Topology | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [message, setMessage] = useState<
    { tone: "success" | "danger" | "info"; text: string } | null
  >(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) as
      | Node<TopologyNodeData>
      | undefined,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId),
    [edges, selectedEdgeId]
  );

  const load = useCallback(async () => {
    const [data, configData] = await Promise.all([
      api.topology(),
      api.config().catch(() => ({ offline_retention_days: 30 }))
    ]);
    setTopology(data);
    setRetentionDays(configData.offline_retention_days ?? 30);

    const now = Date.now();
    const retention = configData.offline_retention_days ?? 30;
    const latestSeen = data.nodes.reduce(
      (max, node) => Math.max(max, Date.parse(node.device.last_seen)),
      0
    );

    const flowNodes: Node<TopologyNodeData>[] = data.nodes.map((node) => {
      const isNew =
        Date.parse(node.device.first_seen) === latestSeen ||
        Date.parse(node.device.last_seen) === latestSeen;
      const isUnclassified = node.x < -100;
      const offlineAge = now - Date.parse(node.device.last_seen);
      const isStale =
        node.device.status === "offline" && offlineAge > retention * MS_PER_DAY;

      return {
        id: node.device_id,
        type: "device",
        position: { x: node.x, y: node.y },
        data: {
          device: node.device,
          customLabel: node.custom_label,
          icon: node.icon,
          isNew,
          isUnclassified,
          isStale,
          isNetworkNode: node.device.is_network_node
        }
      };
    });

    const flowEdges: Edge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: edge.from_device_id,
      target: edge.to_device_id,
      animated: !edge.confirmed_by_user && edge.link_type === "unknown",
      label:
        edge.link_type !== "unknown"
          ? edge.link_type
          : edge.confirmed_by_user
            ? "manual"
            : "auto",
      data: { linkType: edge.link_type, confirmed: edge.confirmed_by_user },
      style: edgeStyle(edge.link_type, edge.id === selectedEdgeId)
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges, selectedEdgeId]);

  useEffect(() => {
    load().catch((err) =>
      setMessage({ tone: "danger", text: String(err) })
    );
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
            style: edgeStyle("unknown", false)
          },
          current
        )
      );
    },
    [setEdges]
  );

  const save = async () => {
    if (!topology) return;
    try {
      const nodePayload = nodes.map((node) => {
        const existing = topology.nodes.find(
          (item) => item.device_id === node.id
        );
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
          link_type: (edge.data as { linkType?: string })?.linkType || "unknown",
          confidence: "manual",
          confirmed_by_user: true
        }));
      await api.saveTopology({
        nodes: nodePayload,
        edges: edgePayload
      });
      setMessage({ tone: "success", text: t("common.save") + " ✓" });
      await load();
    } catch (err) {
      setMessage({
        tone: "danger",
        text:
          err instanceof Error ? err.message : t("errors.saveFailed", { message: "" })
      });
    }
  };

  const updateSelectedNode = (updates: {
    customLabel?: string;
    icon?: string;
  }) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== selectedNodeId) return n;
        return { ...n, data: { ...n.data, ...updates } };
      })
    );
  };

  const updateSelectedEdge = (linkType: string) => {
    if (!selectedEdgeId) return;
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== selectedEdgeId) return e;
        return {
          ...e,
          label: linkType !== "unknown" ? linkType : "manual",
          data: { ...e.data, linkType },
          style: edgeStyle(linkType, true)
        };
      })
    );
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const counts = useMemo(
    () => ({ nodes: nodes.length, edges: edges.length }),
    [edges.length, nodes.length]
  );

  const iconOptions = Object.keys(NODE_ICONS);

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      {!isScreenshotMode && (
        <div className="flex flex-none flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-fg">
              {t("topology.title")}
            </h2>
            <p className="text-sm text-muted">{t("topology.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsScreenshotMode(true)}
            >
              <Share2 className="h-4 w-4" />
              {t("common.screenshot")}
            </Button>
            <Button variant="secondary" onClick={() => load()}>
              <RefreshCw className="h-4 w-4" />
              {t("common.refresh")}
            </Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {message && !isScreenshotMode && (
        <Alert tone={message.tone}>{message.text}</Alert>
      )}

      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          isScreenshotMode
            ? "grid-cols-1"
            : "xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]"
        )}
      >
        <Card
          className={cn(
            "relative overflow-hidden p-0",
            isScreenshotMode
              ? "h-[calc(100vh-4rem)] min-h-[640px]"
              : "h-[calc(100vh-11rem)] min-h-[640px]"
          )}
        >
          {isScreenshotMode && (
            <div className="absolute right-4 top-4 z-50 flex gap-2 no-print">
              <Button
                variant="secondary"
                onClick={() => window.print()}
              >
                <PrintIcon className="h-4 w-4" />
                {t("common.print")}
              </Button>
              <Button
                onClick={() => setIsScreenshotMode(false)}
                variant="primary"
              >
                <EyeOff className="h-4 w-4" />
                {t("common.exit")}
              </Button>
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
            fitViewOptions={{ padding: 0.04 }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1.2}
              color="rgb(var(--border))"
            />
            <Controls showInteractive={false} />
            {!isScreenshotMode && (
              <MiniMap
                pannable
                zoomable
                ariaLabel={t("topology.title") ?? ""}
                maskColor="rgb(var(--bg) / 0.7)"
                nodeColor={(n) => {
                  const data = n.data as TopologyNodeData | undefined;
                  if (!data) return "rgb(var(--subtle))";
                  return data.device.status === "online"
                    ? "rgb(var(--success))"
                    : "rgb(var(--subtle))";
                }}
                nodeStrokeColor="transparent"
              />
            )}
          </ReactFlow>
        </Card>

        {!isScreenshotMode && (
          <Card className="flex h-[calc(100vh-11rem)] min-h-[640px] flex-col overflow-hidden">
            <CardHeader
              title={t("topology.properties.title")}
              className="px-4 py-3"
              actions={
                (selectedNodeId || selectedEdgeId) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeId(null);
                      setSelectedEdgeId(null);
                    }}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </Button>
                )
              }
            />
            <CardBody className="flex-1 overflow-y-auto p-4">
              {selectedNode ? (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-subtle">
                      {t("topology.properties.displayName")}
                    </label>
                    <Input
                      value={selectedNode.data.customLabel ?? ""}
                      onChange={(e) =>
                        updateSelectedNode({ customLabel: e.target.value })
                      }
                      placeholder={
                        selectedNode.data.device.hostname ??
                        selectedNode.data.device.ip
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-subtle">
                      {t("topology.properties.type")}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {iconOptions.map((key) => {
                        const Icon = NODE_ICONS[key];
                        const active =
                          (selectedNode.data.icon ||
                            selectedNode.data.device.device_type) === key;
                        return (
                          <button
                            key={key}
                            onClick={() => updateSelectedNode({ icon: key })}
                            title={key}
                            className={cn(
                              "flex h-10 items-center justify-center rounded-xl border transition-colors",
                              active
                                ? "border-brand bg-brand/10 text-brand"
                                : "border-border bg-surface-soft text-muted hover:text-fg"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl bg-bg-soft p-3 text-xs text-muted">
                    <div className="flex items-center justify-between">
                      <span>{t("topology.properties.ip")}</span>
                      <span className="font-mono text-fg">
                        {selectedNode.data.device.ip}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("topology.properties.mac")}</span>
                      <span className="font-mono text-[11px] uppercase text-fg">
                        {selectedNode.data.device.mac || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("devices.table.status")}</span>
                      <Badge
                        tone={
                          selectedNode.data.device.status === "online"
                            ? "success"
                            : "neutral"
                        }
                        dot
                      >
                        {t(
                          selectedNode.data.device.status === "online"
                            ? "common.online"
                            : "common.offline"
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-subtle">
                      {t("topology.properties.type")}
                    </label>
                    <div className="grid gap-2">
                      {[
                        { id: "ethernet", label: "Ethernet" },
                        { id: "wifi", label: "Wi-Fi" },
                        { id: "unknown", label: t("deviceTypes.unknown") }
                      ].map((type) => {
                        const active =
                          (selectedEdge.data as { linkType?: string })
                            ?.linkType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => updateSelectedEdge(type.id)}
                            className={cn(
                              "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors",
                              active
                                ? "border-brand bg-brand/10 text-brand"
                                : "border-border bg-surface-soft text-muted hover:text-fg"
                            )}
                          >
                            <span>{type.label}</span>
                            {active && <MousePointer2 className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={deleteSelectedEdge}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete")}
                  </Button>
                  <Alert tone="info">
                    <p className="text-xs">
                      {t("topology.edgeHint")}
                    </p>
                  </Alert>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted">
                  <Info className="h-6 w-6 text-subtle" />
                  <p>{t("topology.properties.empty")}</p>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
      {!isScreenshotMode && (
        <p className="text-xs text-subtle">
          {counts.nodes} · {counts.edges} · {t("topology.retention", { days: retentionDays })}
        </p>
      )}
    </div>
  );
}
