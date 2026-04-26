-- =====================================================
-- TICKET BOOKING SYSTEM - ALL QUERIES
-- =====================================================

-- 1. CHECK DATABASE CONNECTION
SELECT 'Connected to Ticket Database!' as status;

-- 2. LIST ALL TABLES
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. DATABASE STATISTICS
SELECT 
    (SELECT COUNT(*) FROM tickets) as total_tickets,
    (SELECT COUNT(*) FROM passengers) as total_passengers,
    (SELECT COUNT(*) FROM payments) as total_payments,
    (SELECT COUNT(*) FROM qr_codes) as total_qr_codes,
    (SELECT COUNT(*) FROM routes) as total_routes,
    (SELECT COUNT(*) FROM buses) as total_buses,
    (SELECT COUNT(*) FROM seats) as total_seats,
    (SELECT COUNT(*) FROM seats WHERE status = 'Available') as available_seats,
    (SELECT COUNT(*) FROM seats WHERE status = 'Booked') as booked_seats,
    (SELECT COALESCE(SUM(payment_amount), 0) FROM payments WHERE payment_status = 'Success') as total_revenue;

-- 4. ALL TICKETS WITH DETAILS
SELECT 
    t.ticket_id, 
    t.ticket_number, 
    t.booking_date,
    p.passenger_name,
    p.contact_number,
    p.age,
    p.gender,
    r.source_city,
    r.destination_city,
    r.base_fare,
    s.seat_number,
    s.seat_type,
    pay.payment_method,
    pay.payment_status,
    pay.payment_amount,
    t.journey_status
FROM tickets t
JOIN passengers p ON t.passenger_id = p.passenger_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id
JOIN seats s ON t.seat_id = s.seat_id
LEFT JOIN payments pay ON t.ticket_id = pay.ticket_id
ORDER BY t.ticket_id;

-- 5. PASSENGERS LIST
SELECT * FROM passengers ORDER BY passenger_id;

-- 6. PAYMENTS LIST
SELECT * FROM payments ORDER BY payment_id;

-- 7. QR CODES LIST
SELECT * FROM qr_codes ORDER BY qr_id;

-- 8. ROUTES WITH SEAT COUNT
SELECT 
    r.route_id,
    r.source_city,
    r.destination_city,
    r.base_fare,
    COUNT(s.seat_id) as total_seats,
    COUNT(CASE WHEN s.status = 'Available' THEN 1 END) as available_seats,
    COUNT(CASE WHEN s.status = 'Booked' THEN 1 END) as booked_seats
FROM routes r
JOIN bus_routes br ON r.route_id = br.route_id
JOIN seats s ON br.bus_id = s.bus_id
GROUP BY r.route_id, r.source_city, r.destination_city, r.base_fare
ORDER BY r.route_id;
