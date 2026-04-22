-- =====================================================================
-- SMART BUS TICKET BOOKING SYSTEM WITH PAYMENT AND QR SCANNER
-- PostgreSQL Version
-- SQL Mini Project for College Evaluation
-- =====================================================================
-- Project Type: Conductor-based ticket system (No user login required)
-- Database: Bus Ticket Management System
-- =====================================================================

-- Step 1: CREATE ENUMS (PostgreSQL specific)
-- =====================================================================

CREATE TYPE conductor_status AS ENUM('Active', 'Inactive');
CREATE TYPE bus_type AS ENUM('AC', 'Non-AC', 'Sleeper');
CREATE TYPE bus_status AS ENUM('Active', 'Maintenance', 'Inactive');
CREATE TYPE seat_type AS ENUM('Window', 'Aisle', 'Middle');
CREATE TYPE seat_status AS ENUM('Available', 'Booked', 'Reserved');
CREATE TYPE route_status AS ENUM('Scheduled', 'Cancelled', 'Completed');
CREATE TYPE journey_status AS ENUM('Booked', 'Checked-In', 'Completed', 'Cancelled');
CREATE TYPE payment_method AS ENUM('Cash', 'UPI', 'Online');
CREATE TYPE payment_status AS ENUM('Success', 'Pending', 'Failed', 'Refunded');
CREATE TYPE qr_scan_status AS ENUM('Not Scanned', 'Scanned', 'Invalid');
CREATE TYPE qr_validity AS ENUM('Valid', 'Invalid', 'Expired', 'Used');
CREATE TYPE id_type AS ENUM('Aadhar', 'PAN', 'Passport', 'DL', 'Voter ID');
CREATE TYPE gender_type AS ENUM('Male', 'Female', 'Other');

-- =====================================================================
-- Step 2: CREATE DATABASE
-- =====================================================================

CREATE DATABASE Ticket;

-- Connect to the database
-- \c bus_ticket_system (in psql client)

-- =====================================================================
-- TABLE 1: CONDUCTORS TABLE
-- =====================================================================
-- Purpose: Store conductor/staff information
-- Normalization: Separate table for conductor master data

CREATE TABLE conductors (
    conductor_id SERIAL PRIMARY KEY,
    conductor_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    contact_number VARCHAR(10) NOT NULL,
    email VARCHAR(100),
    joining_date DATE NOT NULL,
    status conductor_status DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 2: BUSES TABLE
-- =====================================================================
-- Purpose: Store bus information and capacity
-- Normalization: Master data for buses in operation

CREATE TABLE buses (
    bus_id SERIAL PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    bus_name VARCHAR(100) NOT NULL,
    bus_type bus_type NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0),
    available_seats INT NOT NULL CHECK (available_seats >= 0),
    conductor_id INT REFERENCES conductors(conductor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    registration_date DATE NOT NULL,
    status bus_status DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    

-- =====================================================================
-- TABLE 3: ROUTES TABLE
-- =====================================================================
-- Purpose: Store route information
-- Normalization: Separate master table for routes

CREATE TABLE routes (
    route_id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    source_city VARCHAR(50) NOT NULL,
    destination_city VARCHAR(50) NOT NULL,
    distance_km NUMERIC(6,2) NOT NULL,
    estimated_time_hours NUMERIC(5,2) NOT NULL,
    base_fare NUMERIC(8,2) NOT NULL CHECK (base_fare > 0),
    travel_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    status route_status DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 4: BUS_ROUTES JUNCTION TABLE
-- =====================================================================
-- Purpose: Link buses with routes (Many-to-Many relationship)
-- Normalization: Handle M:M relationship between Buses and Routes

CREATE TABLE bus_routes (
    bus_route_id SERIAL PRIMARY KEY,
    bus_id INT NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE ON UPDATE CASCADE,
    route_id INT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE ON UPDATE CASCADE,
    available_capacity INT NOT NULL,
    total_capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bus_id, route_id)
);

-- =====================================================================
-- TABLE 5: SEATS TABLE
-- =====================================================================
-- Purpose: Store seat-level information
-- Normalization: Detailed seat tracking for each bus

CREATE TABLE seats (
    seat_id SERIAL PRIMARY KEY,
    bus_id INT NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE ON UPDATE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    seat_type seat_type NOT NULL,
    status seat_status DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bus_id, seat_number)
);

-- =====================================================================
-- TABLE 6: PASSENGERS TABLE
-- =====================================================================
-- Purpose: Store passenger information
-- Normalization: Master table for passenger data

CREATE TABLE passengers (
    passenger_id SERIAL PRIMARY KEY,
    passenger_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(10) NOT NULL,
    age INT CHECK (age > 0 AND age < 120),
    gender gender_type,
    id_type id_type NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 7: TICKETS TABLE
-- =====================================================================
-- Purpose: Store ticket information
-- Normalization: Core transaction table with FK relationships
-- Key Feature: Each ticket has unique QR Code ID

CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    qr_code_id VARCHAR(100) UNIQUE NOT NULL,
    passenger_id INT NOT NULL REFERENCES passengers(passenger_id) ON DELETE CASCADE ON UPDATE CASCADE,
    bus_route_id INT NOT NULL REFERENCES bus_routes(bus_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
    seat_id INT NOT NULL REFERENCES seats(seat_id) ON DELETE CASCADE ON UPDATE CASCADE,
    conductor_id INT NOT NULL REFERENCES conductors(conductor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    boarding_date DATE NOT NULL,
    journey_status journey_status DEFAULT 'Booked',
    ticket_price NUMERIC(8,2) NOT NULL CHECK (ticket_price > 0),
    qr_scan_status qr_scan_status DEFAULT 'Not Scanned',
    qr_scanned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 8: PAYMENTS TABLE
-- =====================================================================
-- Purpose: Store payment information
-- Normalization: Separate table for financial transactions
-- Key Features: Payment modes, transaction IDs, payment status tracking

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL UNIQUE REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    payment_amount NUMERIC(10,2) NOT NULL CHECK (payment_amount > 0),
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'Pending',
    transaction_id VARCHAR(50) UNIQUE,
    upi_id VARCHAR(50),
    bank_name VARCHAR(100),
    payment_date DATE NOT NULL,
    payment_time TIME NOT NULL,
    payment_received_by INT NOT NULL REFERENCES conductors(conductor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 9: QR_CODES TABLE (For QR Verification Tracking)
-- =====================================================================
-- Purpose: Store QR code verification history
-- Normalization: Audit trail for QR scanning activities

CREATE TABLE qr_codes (
    qr_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    qr_code_id VARCHAR(100) NOT NULL UNIQUE,
    qr_data TEXT NOT NULL,
    qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qr_validity_status qr_validity DEFAULT 'Valid',
    scan_count INT DEFAULT 0,
    last_scanned_at TIMESTAMP NULL,
    last_scanned_by INT REFERENCES conductors(conductor_id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- STEP 2: INSERT SAMPLE DATA
-- =====================================================================

-- Insert Conductors
INSERT INTO conductors (conductor_name, employee_id, contact_number, email, joining_date, status) VALUES
('Rajesh Kumar', 'EMP001', '9876543210', 'rajesh.k@busticketing.com', '2020-01-15', 'Active'),
('Priya Singh', 'EMP002', '9876543211', 'priya.s@busticketing.com', '2020-06-20', 'Active'),
('Arun Patel', 'EMP003', '9876543212', 'arun.p@busticketing.com', '2021-03-10', 'Active'),
('Meera Desai', 'EMP004', '9876543213', 'meera.d@busticketing.com', '2021-08-25', 'Active');

-- Insert Buses
INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, conductor_id, registration_date, status) VALUES
('BUS-001', 'Express 1', 'AC', 45, 45, 1, '2020-02-01', 'Active'),
('BUS-002', 'Premium Sleeper', 'Sleeper', 30, 30, 2, '2020-03-15', 'Active'),
('BUS-003', 'Non-AC 1', 'Non-AC', 50, 50, 3, '2020-04-20', 'Active'),
('BUS-004', 'Luxury Express', 'AC', 40, 40, 4, '2021-01-10', 'Active');

-- Insert Routes
INSERT INTO routes (route_name, source_city, destination_city, distance_km, estimated_time_hours, base_fare, travel_date, departure_time, arrival_time, status) VALUES
('Mumbai-Pune Express', 'Mumbai', 'Pune', 150.00, 3.50, 500.00, '2026-04-25', '09:00:00', '12:30:00', 'Scheduled'),
('Delhi-Agra Express', 'Delhi', 'Agra', 206.00, 4.00, 700.00, '2026-04-25', '06:00:00', '10:00:00', 'Scheduled'),
('Bangalore-Hyderabad', 'Bangalore', 'Hyderabad', 575.00, 9.00, 1200.00, '2026-04-26', '18:00:00', '03:00:00', 'Scheduled'),
('Chennai-Coimbatore', 'Chennai', 'Coimbatore', 180.00, 3.50, 550.00, '2026-04-25', '14:00:00', '17:30:00', 'Scheduled');

-- Insert Bus_Routes
INSERT INTO bus_routes (bus_id, route_id, available_capacity, total_capacity) VALUES
(1, 1, 45, 45),
(2, 2, 30, 30),
(3, 3, 50, 50),
(4, 4, 40, 40);

-- Insert Seats for Bus 1
INSERT INTO seats (bus_id, seat_number, seat_type, status) VALUES
(1, 'A1', 'Window', 'Available'),
(1, 'A2', 'Middle', 'Available'),
(1, 'A3', 'Aisle', 'Available'),
(1, 'B1', 'Window', 'Available'),
(1, 'B2', 'Middle', 'Available'),
(1, 'B3', 'Aisle', 'Available'),
(1, 'C1', 'Window', 'Available'),
(1, 'C2', 'Middle', 'Available'),
(1, 'C3', 'Aisle', 'Available'),
(1, 'D1', 'Window', 'Available'),
(1, 'D2', 'Middle', 'Available'),
(1, 'D3', 'Aisle', 'Available'),
(1, 'E1', 'Window', 'Available'),
(1, 'E2', 'Middle', 'Available'),
(1, 'E3', 'Aisle', 'Available');

-- Insert Seats for Bus 2
INSERT INTO seats (bus_id, seat_number, seat_type, status) VALUES
(2, 'S1', 'Aisle', 'Available'),
(2, 'S2', 'Aisle', 'Available'),
(2, 'S3', 'Aisle', 'Available'),
(2, 'S4', 'Aisle', 'Available'),
(2, 'S5', 'Aisle', 'Available'),
(2, 'S6', 'Aisle', 'Available'),
(2, 'S7', 'Aisle', 'Available'),
(2, 'S8', 'Aisle', 'Available'),
(2, 'S9', 'Aisle', 'Available'),
(2, 'S10', 'Aisle', 'Available');

-- Insert Seats for Bus 3
INSERT INTO seats (bus_id, seat_number, seat_type, status) VALUES
(3, 'N1', 'Window', 'Available'),
(3, 'N2', 'Middle', 'Available'),
(3, 'N3', 'Aisle', 'Available'),
(3, 'N4', 'Window', 'Available'),
(3, 'N5', 'Middle', 'Available'),
(3, 'N6', 'Aisle', 'Available'),
(3, 'N7', 'Window', 'Available'),
(3, 'N8', 'Middle', 'Available'),
(3, 'N9', 'Aisle', 'Available'),
(3, 'N10', 'Window', 'Available'),
(3, 'N11', 'Middle', 'Available'),
(3, 'N12', 'Aisle', 'Available'),
(3, 'N13', 'Window', 'Available'),
(3, 'N14', 'Middle', 'Available'),
(3, 'N15', 'Aisle', 'Available');

-- Insert Seats for Bus 4
INSERT INTO seats (bus_id, seat_number, seat_type, status) VALUES
(4, 'L1', 'Window', 'Available'),
(4, 'L2', 'Middle', 'Available'),
(4, 'L3', 'Aisle', 'Available'),
(4, 'L4', 'Window', 'Available'),
(4, 'L5', 'Middle', 'Available'),
(4, 'L6', 'Aisle', 'Available'),
(4, 'L7', 'Window', 'Available'),
(4, 'L8', 'Middle', 'Available'),
(4, 'L9', 'Aisle', 'Available'),
(4, 'L10', 'Window', 'Available'),
(4, 'L11', 'Middle', 'Available'),
(4, 'L12', 'Aisle', 'Available'),
(4, 'L13', 'Window', 'Available'),
(4, 'L14', 'Middle', 'Available'),
(4, 'L15', 'Aisle', 'Available');

-- Insert Passengers
INSERT INTO passengers (passenger_name, contact_number, age, gender, id_type, id_number) VALUES
('Amit Sharma', '8765432100', 28, 'Male', 'Aadhar', '123456789012'),
('Sneha Gupta', '8765432101', 26, 'Female', 'Aadhar', '223456789012'),
('Rohan Verma', '8765432102', 35, 'Male', 'PAN', 'ABCDE1234F'),
('Pooja Nair', '8765432103', 32, 'Female', 'Passport', 'P12345678'),
('Vikram Singh', '8765432104', 40, 'Male', 'DL', 'DL12345678'),
('Ananya Kapoor', '8765432105', 24, 'Female', 'Aadhar', '323456789012'),
('Nikhil Patel', '8765432106', 29, 'Male', 'Voter ID', 'V12345678'),
('Divya Sharma', '8765432107', 31, 'Female', 'Aadhar', '423456789012');

-- Insert Tickets
INSERT INTO tickets (ticket_number, qr_code_id, passenger_id, bus_route_id, seat_id, conductor_id, booking_date, booking_time, boarding_date, journey_status, ticket_price, qr_scan_status) VALUES
('TKT-001', 'QR-2026-04-25-001', 1, 1, 1, 1, '2026-04-23', '10:30:00', '2026-04-25', 'Booked', 500.00, 'Not Scanned'),
('TKT-002', 'QR-2026-04-25-002', 2, 1, 2, 1, '2026-04-23', '10:45:00', '2026-04-25', 'Booked', 500.00, 'Not Scanned'),
('TKT-003', 'QR-2026-04-25-003', 3, 1, 4, 1, '2026-04-23', '11:00:00', '2026-04-25', 'Booked', 500.00, 'Scanned'),
('TKT-004', 'QR-2026-04-25-004', 4, 2, 21, 2, '2026-04-22', '14:20:00', '2026-04-25', 'Booked', 700.00, 'Not Scanned'),
('TKT-005', 'QR-2026-04-25-005', 5, 2, 22, 2, '2026-04-22', '14:35:00', '2026-04-25', 'Checked-In', 700.00, 'Scanned'),
('TKT-006', 'QR-2026-04-26-001', 6, 3, 31, 3, '2026-04-24', '16:00:00', '2026-04-26', 'Booked', 1200.00, 'Not Scanned'),
('TKT-007', 'QR-2026-04-25-006', 7, 4, 46, 4, '2026-04-23', '13:15:00', '2026-04-25', 'Booked', 550.00, 'Not Scanned'),
('TKT-008', 'QR-2026-04-25-007', 8, 4, 47, 4, '2026-04-23', '13:30:00', '2026-04-25', 'Completed', 550.00, 'Scanned');

-- Insert Payments
INSERT INTO payments (ticket_id, payment_amount, payment_method, payment_status, transaction_id, upi_id, bank_name, payment_date, payment_time, payment_received_by) VALUES
(1, 500.00, 'Cash', 'Success', 'TXN-2026-04-23-001', NULL, NULL, '2026-04-23', '10:31:00', 1),
(2, 500.00, 'UPI', 'Success', 'TXN-2026-04-23-002', 'sneha.gupta@upi', NULL, '2026-04-23', '10:46:00', 1),
(3, 500.00, 'Online', 'Success', 'TXN-2026-04-23-003', NULL, 'ICICI Bank', '2026-04-23', '11:01:00', 1),
(4, 700.00, 'Cash', 'Success', 'TXN-2026-04-22-001', NULL, NULL, '2026-04-22', '14:21:00', 2),
(5, 700.00, 'UPI', 'Success', 'TXN-2026-04-22-002', 'vikram.singh@upi', NULL, '2026-04-22', '14:36:00', 2),
(6, 1200.00, 'Online', 'Pending', 'TXN-2026-04-24-001', NULL, 'HDFC Bank', '2026-04-24', '16:01:00', 3),
(7, 550.00, 'Cash', 'Success', 'TXN-2026-04-23-004', NULL, NULL, '2026-04-23', '13:16:00', 4),
(8, 550.00, 'Online', 'Success', 'TXN-2026-04-23-005', NULL, 'Axis Bank', '2026-04-23', '13:31:00', 4);

-- Insert QR Codes
INSERT INTO qr_codes (ticket_id, qr_code_id, qr_data, qr_validity_status, scan_count, last_scanned_at, last_scanned_by) VALUES
(1, 'QR-2026-04-25-001', '{"ticket_id":"TKT-001","passenger":"Amit Sharma","bus":"BUS-001","seat":"A1","route":"Mumbai-Pune","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(2, 'QR-2026-04-25-002', '{"ticket_id":"TKT-002","passenger":"Sneha Gupta","bus":"BUS-001","seat":"A2","route":"Mumbai-Pune","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(3, 'QR-2026-04-25-003', '{"ticket_id":"TKT-003","passenger":"Rohan Verma","bus":"BUS-001","seat":"B1","route":"Mumbai-Pune","date":"2026-04-25"}', 'Used', 1, '2026-04-25 09:15:00', 1),
(4, 'QR-2026-04-25-004', '{"ticket_id":"TKT-004","passenger":"Pooja Nair","bus":"BUS-002","seat":"S1","route":"Delhi-Agra","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(5, 'QR-2026-04-25-005', '{"ticket_id":"TKT-005","passenger":"Vikram Singh","bus":"BUS-002","seat":"S2","route":"Delhi-Agra","date":"2026-04-25"}', 'Used', 1, '2026-04-25 06:30:00', 2),
(6, 'QR-2026-04-26-001', '{"ticket_id":"TKT-006","passenger":"Ananya Kapoor","bus":"BUS-003","seat":"N1","route":"Bangalore-Hyderabad","date":"2026-04-26"}', 'Valid', 0, NULL, NULL),
(7, 'QR-2026-04-25-006', '{"ticket_id":"TKT-007","passenger":"Nikhil Patel","bus":"BUS-004","seat":"L1","route":"Chennai-Coimbatore","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(8, 'QR-2026-04-25-007', '{"ticket_id":"TKT-008","passenger":"Divya Sharma","bus":"BUS-004","seat":"L2","route":"Chennai-Coimbatore","date":"2026-04-25"}', 'Used', 1, '2026-04-25 14:45:00', 4);

-- Update Seat Status after booking
UPDATE seats SET status = 'Booked' WHERE seat_id IN (1, 2, 4, 21, 22, 31, 46, 47);

-- Update available seats
UPDATE bus_routes SET available_capacity = 37 WHERE bus_route_id = 1;
UPDATE bus_routes SET available_capacity = 28 WHERE bus_route_id = 2;
UPDATE bus_routes SET available_capacity = 49 WHERE bus_route_id = 3;
UPDATE bus_routes SET available_capacity = 38 WHERE bus_route_id = 4;

UPDATE buses SET available_seats = 37 WHERE bus_id = 1;
UPDATE buses SET available_seats = 28 WHERE bus_id = 2;
UPDATE buses SET available_seats = 49 WHERE bus_id = 3;
UPDATE buses SET available_seats = 38 WHERE bus_id = 4;

-- =====================================================================
-- STEP 3: CRITICAL SQL QUERIES FOR VARIOUS OPERATIONS
-- =====================================================================

-- QUERY 1: Show All Available Seats for a Specific Route
SELECT 
    s.seat_id,
    s.seat_number,
    s.seat_type,
    s.status,
    b.bus_number,
    r.route_name,
    r.source_city,
    r.destination_city
FROM seats s
JOIN buses b ON s.bus_id = b.bus_id
JOIN bus_routes br ON b.bus_id = br.bus_id
JOIN routes r ON br.route_id = r.route_id
WHERE r.route_id = 1 AND s.status = 'Available'
ORDER BY s.seat_number;

-- QUERY 2: Get All Booked Tickets
SELECT 
    t.ticket_id,
    t.ticket_number,
    p.passenger_name,
    p.contact_number,
    s.seat_number,
    b.bus_number,
    r.route_name,
    r.source_city,
    r.destination_city,
    t.boarding_date,
    t.ticket_price,
    pay.payment_method,
    pay.payment_status,
    t.journey_status
FROM tickets t
JOIN passengers p ON t.passenger_id = p.passenger_id
JOIN seats s ON t.seat_id = s.seat_id
JOIN buses b ON s.bus_id = b.bus_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id
JOIN payments pay ON t.ticket_id = pay.ticket_id
WHERE t.boarding_date = '2026-04-25'
ORDER BY t.booking_date DESC;

-- QUERY 3: Check Payment Status
SELECT 
    t.ticket_number,
    p.passenger_name,
    pay.payment_amount,
    pay.payment_method,
    pay.payment_status,
    pay.transaction_id,
    pay.payment_date,
    pay.payment_time
FROM payments pay
JOIN tickets t ON pay.ticket_id = t.ticket_id
JOIN passengers p ON t.passenger_id = p.passenger_id
WHERE pay.payment_status = 'Success'
  AND t.boarding_date = '2026-04-25'
ORDER BY pay.payment_date DESC;

-- QUERY 4: Calculate Revenue per Route
SELECT 
    r.route_id,
    r.route_name,
    r.source_city,
    r.destination_city,
    COUNT(t.ticket_id) AS total_tickets,
    SUM(pay.payment_amount) AS total_revenue,
    AVG(pay.payment_amount) AS average_fare,
    MIN(pay.payment_amount) AS minimum_fare,
    MAX(pay.payment_amount) AS maximum_fare
FROM routes r
JOIN bus_routes br ON r.route_id = br.route_id
LEFT JOIN tickets t ON br.bus_route_id = t.bus_route_id
LEFT JOIN payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY r.route_id, r.route_name, r.source_city, r.destination_city
ORDER BY total_revenue DESC;

-- QUERY 5: Booked vs Available Seats Summary
SELECT 
    b.bus_id,
    b.bus_number,
    b.bus_type::text,
    b.total_seats,
    COUNT(CASE WHEN s.status = 'Booked' THEN 1 END) AS booked_seats,
    COUNT(CASE WHEN s.status = 'Available' THEN 1 END) AS available_seats,
    COUNT(CASE WHEN s.status = 'Reserved' THEN 1 END) AS reserved_seats,
    ROUND(
        (COUNT(CASE WHEN s.status = 'Booked' THEN 1 END)::numeric / b.total_seats) * 100, 
        2
    ) AS occupancy_percentage
FROM buses b
JOIN seats s ON b.bus_id = s.bus_id
GROUP BY b.bus_id, b.bus_number, b.bus_type, b.total_seats
ORDER BY occupancy_percentage DESC;

-- QUERY 6: Payment Method Analysis
SELECT 
    pay.payment_method::text,
    COUNT(t.ticket_id) AS total_transactions,
    SUM(pay.payment_amount) AS total_amount,
    AVG(pay.payment_amount) AS average_amount,
    COUNT(CASE WHEN pay.payment_status = 'Success' THEN 1 END) AS successful,
    COUNT(CASE WHEN pay.payment_status = 'Failed' THEN 1 END) AS failed,
    COUNT(CASE WHEN pay.payment_status = 'Pending' THEN 1 END) AS pending
FROM payments pay
JOIN tickets t ON pay.ticket_id = t.ticket_id
GROUP BY pay.payment_method
ORDER BY total_amount DESC;

-- QUERY 7: QR Scan Report
SELECT 
    qr.qr_id,
    qr.qr_code_id,
    t.ticket_number,
    p.passenger_name,
    s.seat_number,
    b.bus_number,
    r.route_name,
    t.boarding_date,
    qr.qr_validity_status::text,
    qr.scan_count,
    qr.last_scanned_at,
    c.conductor_name as last_scanned_by
FROM qr_codes qr
JOIN tickets t ON qr.ticket_id = t.ticket_id
JOIN passengers p ON t.passenger_id = p.passenger_id
JOIN seats s ON t.seat_id = s.seat_id
JOIN buses b ON s.bus_id = b.bus_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id
LEFT JOIN conductors c ON qr.last_scanned_by = c.conductor_id
WHERE qr.qr_validity_status IN ('Valid', 'Used')
ORDER BY t.boarding_date DESC;

-- QUERY 8: Conductor Performance Report
SELECT 
    c.conductor_id,
    c.conductor_name,
    c.employee_id,
    COUNT(DISTINCT t.ticket_id) AS tickets_issued,
    SUM(pay.payment_amount) AS total_collection,
    COUNT(CASE WHEN pay.payment_method = 'Cash' THEN 1 END) AS cash_payments,
    COUNT(CASE WHEN pay.payment_method = 'UPI' THEN 1 END) AS upi_payments,
    COUNT(CASE WHEN pay.payment_method = 'Online' THEN 1 END) AS online_payments,
    COUNT(CASE WHEN pay.payment_status = 'Success' THEN 1 END) AS successful_payments
FROM conductors c
LEFT JOIN tickets t ON c.conductor_id = t.conductor_id
LEFT JOIN payments pay ON t.ticket_id = pay.ticket_id AND pay.payment_status = 'Success'
GROUP BY c.conductor_id, c.conductor_name, c.employee_id
ORDER BY total_collection DESC;

-- QUERY 9: Route-wise Ticket Summary
SELECT 
    r.route_id,
    r.route_name,
    r.source_city,
    r.destination_city,
    r.travel_date,
    r.departure_time,
    COUNT(t.ticket_id) AS total_bookings,
    COUNT(DISTINCT t.passenger_id) AS unique_passengers,
    SUM(CASE WHEN t.journey_status = 'Booked' THEN 1 END) AS status_booked,
    SUM(CASE WHEN t.journey_status = 'Checked-In' THEN 1 END) AS status_checked_in,
    SUM(CASE WHEN t.journey_status = 'Completed' THEN 1 END) AS status_completed,
    SUM(CASE WHEN t.journey_status = 'Cancelled' THEN 1 END) AS status_cancelled
FROM routes r
LEFT JOIN bus_routes br ON r.route_id = br.route_id
LEFT JOIN tickets t ON br.bus_route_id = t.bus_route_id
GROUP BY r.route_id, r.route_name, r.source_city, r.destination_city, 
         r.travel_date, r.departure_time
ORDER BY r.travel_date DESC, r.departure_time;

-- QUERY 10: Find Duplicate Bookings (Safety Check)
SELECT 
    s.seat_number,
    b.bus_number,
    r.route_name,
    r.travel_date,
    COUNT(t.ticket_id) AS booking_count,
    STRING_AGG(p.passenger_name, ', ') AS passengers
FROM tickets t
JOIN seats s ON t.seat_id = s.seat_id
JOIN buses b ON s.bus_id = b.bus_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id
JOIN passengers p ON t.passenger_id = p.passenger_id
WHERE t.journey_status != 'Cancelled'
GROUP BY s.seat_id, s.seat_number, b.bus_number, r.route_name, r.travel_date
HAVING COUNT(t.ticket_id) > 1;

-- =====================================================================
-- STEP 4: TRIGGERS FOR DATA CONSISTENCY (PostgreSQL Syntax)
-- =====================================================================

-- TRIGGER 1: Auto-update Seat Status
CREATE OR REPLACE FUNCTION update_seat_status_after_booking()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE seats 
    SET status = 'Booked' 
    WHERE seat_id = NEW.seat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seat_status_after_booking
AFTER INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_seat_status_after_booking();

-- TRIGGER 2: Update available_seats in Bus when seat is booked
CREATE OR REPLACE FUNCTION update_bus_availability_after_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Booked' AND OLD.status = 'Available' THEN
        UPDATE buses 
        SET available_seats = available_seats - 1 
        WHERE bus_id = NEW.bus_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bus_availability_after_booking
AFTER UPDATE ON seats
FOR EACH ROW
EXECUTE FUNCTION update_bus_availability_after_booking();

-- TRIGGER 3: Update available_capacity in Bus_Routes
CREATE OR REPLACE FUNCTION update_bus_route_capacity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bus_routes 
    SET available_capacity = NEW.available_seats 
    WHERE bus_id = NEW.bus_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bus_route_capacity
AFTER UPDATE ON buses
FOR EACH ROW
EXECUTE FUNCTION update_bus_route_capacity();

-- =====================================================================
-- STEP 5: STORED PROCEDURES (PostgreSQL Functions)
-- =====================================================================

-- PROCEDURE 1: Book Ticket (Complete transaction)
CREATE OR REPLACE FUNCTION book_ticket(
    p_passenger_name VARCHAR,
    p_contact_number VARCHAR,
    p_age INT,
    p_gender gender_type,
    p_id_type id_type,
    p_id_number VARCHAR,
    p_bus_route_id INT,
    p_seat_id INT,
    p_conductor_id INT,
    p_payment_method payment_method,
    p_transaction_id VARCHAR,
    p_ticket_price NUMERIC
)
RETURNS TABLE (ticket_id INT, ticket_number VARCHAR, qr_code VARCHAR) AS $$
DECLARE
    v_passenger_id INT;
    v_ticket_id INT;
    v_ticket_number VARCHAR;
    v_qr_code_id VARCHAR;
BEGIN
    -- Insert Passenger
    INSERT INTO passengers (passenger_name, contact_number, age, gender, id_type, id_number)
    VALUES (p_passenger_name, p_contact_number, p_age, p_gender, p_id_type, p_id_number)
    RETURNING passengers.passenger_id INTO v_passenger_id;
    
    v_ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || v_passenger_id;
    v_qr_code_id := 'QR-' || TO_CHAR(NOW(), 'YYYY-MM-DD') || '-' || LPAD(v_ticket_id::text, 3, '0');
    
    -- Insert Ticket
    INSERT INTO tickets (ticket_number, qr_code_id, passenger_id, bus_route_id, seat_id, 
                         conductor_id, booking_date, booking_time, boarding_date, ticket_price)
    VALUES (v_ticket_number, v_qr_code_id, v_passenger_id, p_bus_route_id, p_seat_id, 
            p_conductor_id, CURRENT_DATE, CURRENT_TIME, CURRENT_DATE, p_ticket_price)
    RETURNING tickets.ticket_id INTO v_ticket_id;
    
    -- Update seat status
    UPDATE seats SET status = 'Booked' WHERE seat_id = p_seat_id;
    
    -- Insert Payment
    INSERT INTO payments (ticket_id, payment_amount, payment_method, payment_status, 
                         transaction_id, payment_date, payment_time, payment_received_by)
    VALUES (v_ticket_id, p_ticket_price, p_payment_method, 'Success', 
            p_transaction_id, CURRENT_DATE, CURRENT_TIME, p_conductor_id);
    
    -- Insert QR Code
    INSERT INTO qr_codes (ticket_id, qr_code_id, qr_data, qr_validity_status)
    VALUES (v_ticket_id, v_qr_code_id, 
            '{"ticket_id":"' || v_ticket_number || '","passenger":"' || p_passenger_name || '","status":"valid"}', 
            'Valid');
    
    RETURN QUERY SELECT v_ticket_id, v_ticket_number, v_qr_code_id;
END;
$$ LANGUAGE plpgsql;

-- PROCEDURE 2: Update QR Scan Status
CREATE OR REPLACE FUNCTION scan_qr_code(
    p_qr_code_id VARCHAR,
    p_conductor_id INT
)
RETURNS TABLE (status VARCHAR, passenger_name VARCHAR) AS $$
DECLARE
    v_ticket_id INT;
BEGIN
    -- Get ticket ID and check if QR is valid
    SELECT ticket_id INTO v_ticket_id 
    FROM qr_codes 
    WHERE qr_code_id = p_qr_code_id 
      AND qr_validity_status = 'Valid';
    
    IF v_ticket_id IS NOT NULL THEN
        -- Update QR code scan information
        UPDATE qr_codes 
        SET scan_count = scan_count + 1,
            last_scanned_at = NOW(),
            last_scanned_by = p_conductor_id,
            qr_validity_status = 'Used'
        WHERE qr_code_id = p_qr_code_id;
        
        -- Update ticket status
        UPDATE tickets 
        SET qr_scan_status = 'Scanned',
            qr_scanned_at = NOW(),
            journey_status = 'Checked-In'
        WHERE ticket_id = v_ticket_id;
        
        RETURN QUERY SELECT 'QR Scanned Successfully'::VARCHAR, 
               (SELECT passenger_name FROM passengers p 
                JOIN tickets t ON p.passenger_id = t.passenger_id 
                WHERE t.ticket_id = v_ticket_id)::VARCHAR;
    ELSE
        RETURN QUERY SELECT 'Invalid QR Code'::VARCHAR, NULL::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- PROCEDURE 3: Get Available Seats
CREATE OR REPLACE FUNCTION get_available_seats(p_route_id INT)
RETURNS TABLE (seat_id INT, seat_number VARCHAR, seat_type seat_type, bus_number VARCHAR, route_name VARCHAR, source_city VARCHAR, destination_city VARCHAR, departure_time TIME) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.seat_id,
        s.seat_number,
        s.seat_type,
        b.bus_number,
        r.route_name,
        r.source_city,
        r.destination_city,
        r.departure_time
    FROM seats s
    JOIN buses b ON s.bus_id = b.bus_id
    JOIN bus_routes br ON b.bus_id = br.bus_id
    JOIN routes r ON br.route_id = r.route_id
    WHERE r.route_id = p_route_id 
      AND s.status = 'Available'
    ORDER BY s.seat_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- STEP 6: VIEWS FOR COMMON QUERIES
-- =====================================================================

-- VIEW 1: Active Routes with Availability
CREATE OR REPLACE VIEW active_routes_view AS
SELECT 
    r.route_id,
    r.route_name,
    r.source_city,
    r.destination_city,
    r.distance_km,
    r.base_fare,
    r.travel_date,
    r.departure_time,
    br.total_capacity,
    br.available_capacity,
    (br.total_capacity - br.available_capacity) AS booked_seats,
    ROUND((br.available_capacity::numeric / br.total_capacity) * 100, 2) AS availability_percentage
FROM routes r
JOIN bus_routes br ON r.route_id = br.route_id
WHERE r.status = 'Scheduled'
ORDER BY r.travel_date, r.departure_time;

-- VIEW 2: Ticket Status Summary
CREATE OR REPLACE VIEW ticket_status_view AS
SELECT 
    t.ticket_id,
    t.ticket_number,
    p.passenger_name,
    s.seat_number,
    b.bus_number,
    r.route_name,
    t.boarding_date,
    t.journey_status::text,
    pay.payment_status::text,
    t.qr_scan_status::text
FROM tickets t
JOIN passengers p ON t.passenger_id = p.passenger_id
JOIN seats s ON t.seat_id = s.seat_id
JOIN buses b ON s.bus_id = b.bus_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id
JOIN payments pay ON t.ticket_id = pay.ticket_id;

-- VIEW 3: Revenue Summary
CREATE OR REPLACE VIEW revenue_summary_view AS
SELECT 
    DATE(pay.payment_date) AS payment_date,
    r.route_name,
    COUNT(t.ticket_id) AS tickets_sold,
    SUM(pay.payment_amount) AS daily_revenue,
    AVG(pay.payment_amount) AS average_ticket_price,
    COUNT(CASE WHEN pay.payment_method = 'Cash' THEN 1 END) AS cash_count,
    COUNT(CASE WHEN pay.payment_method = 'UPI' THEN 1 END) AS upi_count,
    COUNT(CASE WHEN pay.payment_method = 'Online' THEN 1 END) AS online_count
FROM payments pay
JOIN tickets t ON pay.ticket_id = t.ticket_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id
WHERE pay.payment_status = 'Success'
GROUP BY DATE(pay.payment_date), r.route_name;

-- =====================================================================
-- STEP 7: INDEX CREATION FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

CREATE INDEX idx_seats_bus_status ON seats(bus_id, status);
CREATE INDEX idx_tickets_passenger ON tickets(passenger_id);
CREATE INDEX idx_tickets_boarding_date ON tickets(boarding_date);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_qr_codes_validity ON qr_codes(qr_validity_status);
CREATE INDEX idx_routes_date ON routes(travel_date);

-- =====================================================================
-- END OF SQL MINI PROJECT - PostgreSQL VERSION
-- =====================================================================
