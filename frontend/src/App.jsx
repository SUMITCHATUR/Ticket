import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { SQLProvider } from './context/SQLContext';
import SQLMonitor from './components/SQLMonitor';
import PassengerHome from './pages/PassengerHome';
import AdminDashboard from './pages/AdminDashboard';
import { Home, LayoutDashboard } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '60px', /* Above SQL monitor when collapsed */
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0',
      zIndex: 50,
      boxShadow: '0 -4px 10px rgba(0,0,0,0.02)'
    }}>
      <Link to="/" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
        color: location.pathname === '/' ? '#2563eb' : '#64748b'
      }}>
        <Home size={24} />
        <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '500' }}>Book</span>
      </Link>
      <Link to="/admin" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none',
        color: location.pathname === '/admin' ? '#2563eb' : '#64748b'
      }}>
        <LayoutDashboard size={24} />
        <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '500' }}>Admin</span>
      </Link>
    </div>
  );
};

function App() {
  return (
    <SQLProvider>
      <Router>
        <div style={{ position: 'relative', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<PassengerHome />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
          <BottomNav />
          <SQLMonitor />
        </div>
      </Router>
    </SQLProvider>
  );
}

export default App;
