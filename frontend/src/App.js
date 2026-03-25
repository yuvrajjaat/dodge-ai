import React, { useState, useEffect } from 'react';
import GraphView from './components/GraphView';
import SearchBar from './components/SearchBar';
import MetadataPanel from './components/MetadataPanel';
import QueryPanel from './components/QueryPanel';
import Legend from './components/Legend';
import './App.css';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [visibleNodes, setVisibleNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showQuery, setShowQuery] = useState(false);

  useEffect(() => {
    fetch('/graph-data.json')
      .then(r => r.json())
      .then(data => {
        setGraphData(data);
        // Start with just customer nodes visible
        const initial = new Set();
        data.nodes.filter(n => n.type === 'Customer').forEach(n => initial.add(n.id));
        setVisibleNodes(initial);
        setLoading(false);
      });
  }, []);

  const expandNode = (nodeId) => {
    if (!graphData) return;
    const neighbors = graphData.adjacency[nodeId] || [];
    setVisibleNodes(prev => {
      const next = new Set(prev);
      next.add(nodeId);
      neighbors.forEach(n => next.add(n.node));
      return next;
    });
  };

  const focusNode = (nodeId) => {
    if (!graphData) return;
    const neighbors = graphData.adjacency[nodeId] || [];
    const next = new Set();
    next.add(nodeId);
    neighbors.forEach(n => next.add(n.node));
    setVisibleNodes(next);
    setSelectedNode(graphData.nodes.find(n => n.id === nodeId) || null);
  };

  if (loading) {
    return <div className="loading">Loading SAP O2C Graph...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SAP Order-to-Cash Graph</h1>
        <div className="header-right">
          <SearchBar nodes={graphData.nodes} onSelect={focusNode} />
          <button
            className={`query-toggle ${showQuery ? 'active' : ''}`}
            onClick={() => setShowQuery(v => !v)}
            title="Ask a question"
          >
            💬 Ask
          </button>
        </div>
      </header>
      <div className="app-body">
        <div className="graph-container">
          <GraphView
            graphData={graphData}
            visibleNodes={visibleNodes}
            selectedNodeId={selectedNode?.id}
            onNodeClick={(node) => {
              setSelectedNode(node);
              expandNode(node.id);
            }}
          />
          <Legend />
          {selectedNode && (
            <MetadataPanel
              node={selectedNode}
              neighbors={graphData.adjacency[selectedNode.id] || []}
              onClose={() => setSelectedNode(null)}
              onNavigate={focusNode}
            />
          )}
        </div>
        {showQuery && <QueryPanel onClose={() => setShowQuery(false)} />}
      </div>
    </div>
  );
}

export default App;
