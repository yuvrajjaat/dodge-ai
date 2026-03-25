import React, { useState, useRef, useEffect } from 'react';

function QueryPanel({ onClose }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedData, setExpandedData] = useState(null);
  const historyRef = useRef(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    setHistory(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    setExpandedData(null);

    try {
      const res = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        data: data.data,
        sql: data.sql,
      }]);
    } catch (err) {
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to the backend. Make sure the server is running on port 3001.',
        data: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-header-title">Chat with Graph</span>
          <span className="chat-header-subtitle">Order to Cash</span>
        </div>
        <button className="chat-close" onClick={onClose}>&times;</button>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={historyRef}>
        {/* Welcome message */}
        {history.length === 0 && (
          <>
            <div className="chat-msg chat-msg-ai">
              <div className="chat-avatar-row">
                <div className="chat-avatar">D</div>
                <div className="chat-sender">
                  <span className="chat-sender-name">Dodge AI</span>
                  <span className="chat-sender-role">Graph Agent</span>
                </div>
              </div>
              <div className="chat-bubble chat-bubble-ai">
                Hi! I can help you analyze the <strong>Order to Cash</strong> process.
              </div>
            </div>
            <div className="chat-suggestions">
              {[
                'How many sales orders are there?',
                'Top 5 customers by order value',
                'Show cancelled billing documents',
                'Which products have the most orders?',
              ].map((q, i) => (
                <button key={i} className="chat-suggestion" onClick={() => setInput(q)}>{q}</button>
              ))}
            </div>
          </>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg-${msg.role === 'user' ? 'user' : 'ai'}`}>
            {msg.role === 'user' ? (
              <>
                <div className="chat-avatar-row chat-avatar-row-right">
                  <span className="chat-sender-name">You</span>
                  <div className="chat-avatar chat-avatar-user">Y</div>
                </div>
                <div className="chat-bubble chat-bubble-user">{msg.content}</div>
              </>
            ) : (
              <>
                <div className="chat-avatar-row">
                  <div className="chat-avatar">D</div>
                  <div className="chat-sender">
                    <span className="chat-sender-name">Dodge AI</span>
                    <span className="chat-sender-role">Graph Agent</span>
                  </div>
                </div>
                <div className="chat-bubble chat-bubble-ai">{msg.content}</div>
                {msg.data && msg.data.length > 0 && (
                  <button
                    className="chat-data-toggle"
                    onClick={() => setExpandedData(expandedData === i ? null : i)}
                  >
                    {expandedData === i ? 'Hide data' : `View data (${msg.data.length} rows)`}
                  </button>
                )}
                {expandedData === i && msg.data && (
                  <div className="chat-data-table-wrap">
                    <table className="chat-data-table">
                      <thead>
                        <tr>
                          {Object.keys(msg.data[0]).map(k => <th key={k}>{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.data.slice(0, 20).map((row, ri) => (
                          <tr key={ri}>
                            {Object.values(row).map((v, ci) => <td key={ci}>{v != null ? String(v) : ''}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {msg.data.length > 20 && (
                      <div className="chat-data-more">Showing 20 of {msg.data.length} rows</div>
                    )}
                  </div>
                )}
                {msg.sql && (
                  <details className="chat-sql-details">
                    <summary>SQL</summary>
                    <pre className="chat-sql">{msg.sql}</pre>
                  </details>
                )}
              </>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-msg chat-msg-ai">
            <div className="chat-avatar-row">
              <div className="chat-avatar">D</div>
              <div className="chat-sender">
                <span className="chat-sender-name">Dodge AI</span>
                <span className="chat-sender-role">Graph Agent</span>
              </div>
            </div>
            <div className="chat-bubble chat-bubble-ai chat-typing">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="chat-status">
        <span className={`chat-status-dot ${loading ? 'thinking' : 'ready'}`}></span>
        <span className="chat-status-text">
          {loading ? 'Dodge AI is thinking...' : 'Dodge AI is awaiting instructions'}
        </span>
      </div>

      {/* Input */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Analyze anything"
          disabled={loading}
        />
        <button className="chat-send" type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default QueryPanel;
