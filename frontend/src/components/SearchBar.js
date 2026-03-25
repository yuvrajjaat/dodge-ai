import React, { useState, useRef, useEffect } from 'react';
import NODE_COLORS from './nodeColors';

function SearchBar({ nodes, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const lower = q.toLowerCase();
    const matches = nodes
      .filter(n => n.label.toLowerCase().includes(lower) || n.id.toLowerCase().includes(lower) ||
        (n.metadata && Object.values(n.metadata).some(v => String(v).toLowerCase().includes(lower))))
      .slice(0, 20);
    setResults(matches);
    setOpen(matches.length > 0);
  };

  return (
    <div className="search-bar" ref={ref}>
      <input
        placeholder="Search by ID, name, or keyword..."
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="search-results">
          {results.map(n => (
            <div key={n.id} className="search-result-item" onClick={() => {
              onSelect(n.id);
              setOpen(false);
              setQuery('');
            }}>
              <span className="search-type-badge" style={{ background: NODE_COLORS[n.type]?.border || '#666' }}>
                {n.type}
              </span>
              <span className="search-result-label">{n.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
