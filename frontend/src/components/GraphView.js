import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NODE_COLORS from './nodeColors';

// Simple layout: arrange by type in columns
const TYPE_COLUMNS = {
  Customer: 0,
  SalesOrder: 1,
  Product: 2,
  Plant: 3,
  Delivery: 4,
  BillingDocument: 5,
  Payment: 6,
};

function layoutNodes(visibleNodes, allNodes) {
  const nodeMap = new Map();
  allNodes.forEach(n => nodeMap.set(n.id, n));

  // Group by type
  const groups = {};
  for (const id of visibleNodes) {
    const node = nodeMap.get(id);
    if (!node) continue;
    if (!groups[node.type]) groups[node.type] = [];
    groups[node.type].push(node);
  }

  const flowNodes = [];
  const COL_WIDTH = 220;
  const ROW_HEIGHT = 60;

  for (const [type, nodes] of Object.entries(groups)) {
    const col = TYPE_COLUMNS[type] ?? 0;
    nodes.forEach((node, idx) => {
      const colors = NODE_COLORS[node.type] || { bg: '#f3f4f6', border: '#666', text: '#333' };
      flowNodes.push({
        id: node.id,
        position: { x: col * COL_WIDTH, y: idx * ROW_HEIGHT },
        data: { label: node.label, nodeData: node },
        style: {
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          color: colors.text,
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 500,
          minWidth: 80,
          maxWidth: 180,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        },
      });
    });
  }
  return flowNodes;
}

function GraphView({ graphData, visibleNodes, selectedNodeId, onNodeClick }) {
  const flowNodes = useMemo(() => {
    return layoutNodes(visibleNodes, graphData.nodes);
  }, [visibleNodes, graphData.nodes]);

  const flowEdges = useMemo(() => {
    return graphData.edges
      .filter(e => visibleNodes.has(e.source) && visibleNodes.has(e.target))
      .map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'default',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        labelStyle: { fontSize: 9, fill: '#64748b' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#94a3b8' },
      }));
  }, [visibleNodes, graphData.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync when visibleNodes change
  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    if (node.data?.nodeData) {
      onNodeClick(node.data.nodeData);
    }
  }, [onNodeClick]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={3}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e2e8f0" gap={20} />
      <Controls />
    </ReactFlow>
  );
}

export default GraphView;
