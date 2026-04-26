import React, { useState } from 'react';
import { useSQLMonitor } from '../context/SQLContext';
import { Search, MapPin, Calendar, Clock, CreditCard } from 'lucide-react';

const PassengerHome = () => {
  const { addQuery } = useSQLMonitor();
  const [source, setSource] = useState('New Delhi');
  const [destination, setDestination] = useState('Jaipur');
  const [routes, setRoutes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');

  const handleSearch = () => {
    setIsSearching(true);
    setBookingStatus('');
    // Mock the backend call and inject SQL into the monitor
    addQuery('Search Routes', `SELECT r.id, r.source, r.destination, r.distance_km, r.base_fare, 
       b.bus_number, b.capacity
FROM routes r
JOIN bus_routes br ON r.id = br.route_id
JOIN buses b ON br.bus_id = b.id
WHERE r.source = '${source}' AND r.destination = '${destination}';`);

    setTimeout(() => {
      setRoutes([
        { id: 1, base_fare: 450, bus_number: 'RJ-14-PB-0200', time: '08:00 AM' },
        { id: 2, base_fare: 450, bus_number: 'DL-01-GB-8399', time: '11:30 AM' }
      ]);
      setIsSearching(false);
    }, 1000);
  };

  const handleBook = (route) => {
    addQuery('Check Availability', `SELECT COUNT(*) as booked_seats 
FROM tickets 
WHERE route_id = ${route.id} AND status = 'CONFIRMED';`);

    setTimeout(() => {
      addQuery('Book Ticket', `BEGIN TRANSACTION;
INSERT INTO passengers (name, phone) 
VALUES ('John Doe', '9876543210') RETURNING id;

INSERT INTO payments (amount, method, status) 
VALUES (${route.base_fare}, 'ONLINE', 'COMPLETED') RETURNING id;

INSERT INTO tickets (route_id, passenger_id, payment_id, seat_number, status) 
VALUES (${route.id}, 101, 505, 12, 'CONFIRMED');

COMMIT;`);
      
      setBookingStatus('Ticket booked successfully! Seat Number: 12');
    }, 1500);
  };

  return (
    <div className="app-container">
      <div className="glass-header" style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem' }}>GovBus <span style={{ color: 'var(--primary-color)' }}>Tickets</span></h2>
      </div>

      <div style={{ padding: '20px' }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <div className="input-group">
            <label className="input-label">Leaving From</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={20} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '40px' }} 
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Going To</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={20} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '40px' }} 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary mt-4" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching Buses...' : (
              <>
                <Search size={18} style={{ marginRight: '8px' }} /> Search Buses
              </>
            )}
          </button>
        </div>

        {bookingStatus && (
          <div style={{ padding: '16px', background: '#d1fae5', color: '#065f46', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
            {bookingStatus}
          </div>
        )}

        {routes.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Available Buses</h3>
            {routes.map(r => (
              <div key={r.id} className="glass route-card">
                <div className="route-header">
                  <div className="route-time">
                    <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    {r.time}
                  </div>
                  <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>₹{r.base_fare}</div>
                </div>
                <div className="route-locations">
                  <span style={{ fontWeight: '600' }}>{r.bus_number}</span> • AC Seater
                </div>
                <button 
                  className="btn" 
                  style={{ background: 'var(--bg-color)', border: '1px solid #e2e8f0', marginTop: '8px' }}
                  onClick={() => handleBook(r)}
                  disabled={!!bookingStatus}
                >
                  <CreditCard size={16} style={{ marginRight: '8px' }} /> 
                  Book Ticket
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerHome;
