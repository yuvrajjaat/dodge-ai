import React from 'react';
import NODE_COLORS from './nodeColors';

function Legend() {
  return (
    <div className="legend">
      <h4>Node Types</h4>
      {Object.entries(NODE_COLORS).map(([type, colors]) => (
        <div key={type} className="legend-item">
          <div className="legend-dot" style={{ background: colors.border }} />
          <span>{type}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#888' }}>
        Click a node to expand neighbors
      </div>
    </div>
  );
}

export default Legend;
