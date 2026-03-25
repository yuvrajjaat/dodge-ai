import React from 'react';
import NODE_COLORS from './nodeColors';

function MetadataPanel({ node, neighbors, onClose, onNavigate }) {
  const colors = NODE_COLORS[node.type] || { border: '#666' };

  return (
    <div className="metadata-panel">
      <div className="metadata-header">
        <h3>{node.label}</h3>
        <button className="metadata-close" onClick={onClose}>&times;</button>
      </div>
      <span className="metadata-type" style={{ background: colors.border }}>{node.type}</span>
      <div className="metadata-fields">
        {node.metadata && Object.entries(node.metadata).map(([key, value]) => (
          value != null && value !== '' && (
            <div key={key} className="metadata-field">
              <div className="metadata-field-key">{key}</div>
              <div className="metadata-field-value">{String(value)}</div>
            </div>
          )
        ))}
      </div>
      {neighbors.length > 0 && (
        <div className="metadata-neighbors">
          <h4>Connected ({neighbors.length})</h4>
          {neighbors.slice(0, 30).map((n, i) => (
            <div key={i} className="neighbor-item" onClick={() => onNavigate(n.node)}>
              <span className="neighbor-direction">{n.direction === 'out' ? '→' : '←'}</span>
              <span>{n.node.replace(/^(customer|so|del|bill|pay|product|plant)-/, '')}</span>
              <span className="neighbor-label-tag">{n.label}</span>
            </div>
          ))}
          {neighbors.length > 30 && <div style={{ fontSize: '0.75rem', color: '#888', padding: '4px 0' }}>...and {neighbors.length - 30} more</div>}
        </div>
      )}
    </div>
  );
}

export default MetadataPanel;
