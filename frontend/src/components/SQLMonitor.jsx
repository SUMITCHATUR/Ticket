import React, { useState, useEffect, useRef } from 'react';
import { useSQLMonitor } from '../context/SQLContext';
import { Terminal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

const SQLMonitor = () => {
  const { queries, clearQueries } = useSQLMonitor();
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom and optionally open if a new query arrives
    if (queries.length > 0) {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [queries]);

  return (
    <div className={`sql-monitor ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sql-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="sql-title">
          <Terminal size={18} />
          <span>SQL Activity Monitor</span>
          {queries.length > 0 && <div className="sql-pulse"></div>}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isExpanded && (
            <Trash2 
              size={16} 
              color="#ef4444" 
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); clearQueries(); }} 
            />
          )}
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="sql-content">
          {queries.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>
              No SQL activity yet. Perform an action to see queries.
            </p>
          ) : (
            queries.map((q) => (
              <div key={q.id} style={{ marginBottom: '16px' }} className="animate-slide-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="sql-badge">{q.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{q.timestamp}</span>
                </div>
                <div className="sql-query">{q.sql}</div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginTop: '8px' }} />
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default SQLMonitor;
