import React, { useEffect, useState } from 'react';
import { useSQLMonitor } from '../context/SQLContext';
import { BarChart3, Users, Route as RouteIcon, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const { addQuery } = useSQLMonitor();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Initial load: Query top KPIs
    addQuery('Load Dashboard KPI', `SELECT 
  COUNT(t.id) as total_tickets,
  SUM(p.amount) as total_revenue,
  (SELECT COUNT(*) FROM buses WHERE status='ACTIVE') as active_buses
FROM tickets t
JOIN payments p ON t.payment_id = p.id
WHERE t.created_at >= CURRENT_DATE;`);

    setTimeout(() => {
      setStats({
        revenue: '₹45,200',
        tickets: 142,
        activeBuses: 24
      });
    }, 800);
  }, [addQuery]);

  const loadRoutePerformance = () => {
    addQuery('Route Performance Analysis', `SELECT 
  r.source, 
  r.destination, 
  COUNT(t.id) as tickets_sold,
  SUM(p.amount) as revenue
FROM routes r
JOIN tickets t ON r.id = t.route_id
JOIN payments p ON t.payment_id = p.id
GROUP BY r.source, r.destination
ORDER BY revenue DESC
LIMIT 5;`);
  };

  return (
    <div className="app-container" style={{ background: '#f1f5f9' }}>
      <div className="glass-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Admin Operations</h2>
        <div className="btn-icon" style={{ background: '#e2e8f0', width: '32px', height: '32px' }}>
          <Users size={16} />
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>Daily Revenue</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981' }}>{stats ? stats.revenue : '...'}</div>
          </div>
          <div className="glass" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>Tickets Sold</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#3b82f6' }}>{stats ? stats.tickets : '...'}</div>
          </div>
        </div>

        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Advanced Analytics</h3>
        
        <button 
          className="btn glass" 
          style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'flex-start', border: '1px solid #cbd5e1' }}
          onClick={loadRoutePerformance}
        >
          <div className="btn-icon" style={{ background: '#3b82f6', color: 'white', marginRight: '16px' }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', color: '#0f172a' }}>Route Performance</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Run GROUP BY analysis</div>
          </div>
        </button>

        <button 
          className="btn glass" 
          style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', border: '1px solid #cbd5e1' }}
          onClick={() => {
            addQuery('Conductor Status', `SELECT c.name, c.shift_status, b.bus_number
FROM conductors c
LEFT JOIN bus_assignments ba ON c.id = ba.conductor_id
LEFT JOIN buses b ON ba.bus_id = b.id
WHERE c.status = 'ACTIVE';`);
          }}
        >
          <div className="btn-icon" style={{ background: '#f59e0b', color: 'white', marginRight: '16px' }}>
            <RouteIcon size={20} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', color: '#0f172a' }}>Active Conductors</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Live tracking via LEFT JOIN</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
