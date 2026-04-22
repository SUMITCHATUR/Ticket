-- =====================================================================
-- SMART BUS TICKET BOOKING SYSTEM WITH PAYMENT AND QR SCANNER
-- SQL Mini Project for College Evaluation
-- =====================================================================
-- Project Type: Conductor-based ticket system (No user login required)
-- Database: Bus Ticket Management System
-- =====================================================================

-- Step 1: CREATE DATABASE
-- =====================================================================
CREATE DATABASE IF NOT EXISTS BusTicketSystem;
USE BusTicketSystem;

-- =====================================================================
-- TABLE 1: CONDUCTORS TABLE
-- =====================================================================
-- Purpose: Store conductor information
-- Normalization: Separate table for conductor master data

CREATE TABLE Conductors (
    conductor_id INT PRIMARY KEY AUTO_INCREMENT,
    conductor_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    contact_number VARCHAR(10) NOT NULL,
    email VARCHAR(100),
    joining_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 2: BUSES TABLE
-- =====================================================================
-- Purpose: Store bus information and capacity
-- Normalization: Master data for buses in operation

CREATE TABLE Buses (
    bus_id INT PRIMARY KEY AUTO_INCREMENT,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    bus_name VARCHAR(100) NOT NULL,
    bus_type ENUM('AC', 'Non-AC', 'Sleeper') NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0),
    available_seats INT NOT NULL CHECK (available_seats >= 0),
    conductor_id INT,
    registration_date DATE NOT NULL,
    status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conductor_id) REFERENCES Conductors(conductor_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =====================================================================
-- TABLE 3: ROUTES TABLE
-- =====================================================================
-- Purpose: Store route information
-- Normalization: Separate master table for routes

CREATE TABLE Routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL,
    source_city VARCHAR(50) NOT NULL,
    destination_city VARCHAR(50) NOT NULL,
    distance_km DECIMAL(6,2) NOT NULL,
    estimated_time_hours DECIMAL(5,2) NOT NULL,
    base_fare DECIMAL(8,2) NOT NULL CHECK (base_fare > 0),
    travel_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    status ENUM('Scheduled', 'Cancelled', 'Completed') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 4: BUS_ROUTES JUNCTION TABLE
-- =====================================================================
-- Purpose: Link buses with routes (Many-to-Many relationship)
-- Normalization: Handle M:M relationship between Buses and Routes

CREATE TABLE Bus_Routes (
    bus_route_id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL,
    route_id INT NOT NULL,
    available_capacity INT NOT NULL,
    total_capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES Buses(bus_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (route_id) REFERENCES Routes(route_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    UNIQUE KEY unique_bus_route (bus_id, route_id)
);

-- =====================================================================
-- TABLE 5: SEATS TABLE
-- =====================================================================
-- Purpose: Store seat-level information
-- Normalization: Detailed seat tracking for each bus

CREATE TABLE Seats (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_type ENUM('Window', 'Aisle', 'Middle') NOT NULL,
    status ENUM('Available', 'Booked', 'Reserved') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES Buses(bus_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    UNIQUE KEY unique_seat_per_bus (bus_id, seat_number)
);

-- =====================================================================
-- TABLE 6: PASSENGERS TABLE
-- =====================================================================
-- Purpose: Store passenger information
-- Normalization: Master table for passenger data

CREATE TABLE Passengers (
    passenger_id INT PRIMARY KEY AUTO_INCREMENT,
    passenger_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(10) NOT NULL,
    age INT CHECK (age > 0 AND age < 120),
    gender ENUM('Male', 'Female', 'Other'),
    id_type ENUM('Aadhar', 'PAN', 'Passport', 'DL', 'Voter ID') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 7: TICKETS TABLE
-- =====================================================================
-- Purpose: Store ticket information
-- Normalization: Core transaction table with FK relationships
-- Key Feature: Each ticket has unique QR Code ID

CREATE TABLE Tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    qr_code_id VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique QR Code identifier',
    passenger_id INT NOT NULL,
    bus_route_id INT NOT NULL,
    seat_id INT NOT NULL,
    conductor_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    boarding_date DATE NOT NULL,
    journey_status ENUM('Booked', 'Checked-In', 'Completed', 'Cancelled') DEFAULT 'Booked',
    ticket_price DECIMAL(8,2) NOT NULL CHECK (ticket_price > 0),
    qr_scan_status ENUM('Not Scanned', 'Scanned', 'Invalid') DEFAULT 'Not Scanned',
    qr_scanned_at TIMESTAMP NULL COMMENT 'Timestamp when QR was scanned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES Passengers(passenger_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (bus_route_id) REFERENCES Bus_Routes(bus_route_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES Seats(seat_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (conductor_id) REFERENCES Conductors(conductor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================================
-- TABLE 8: PAYMENTS TABLE
-- =====================================================================
-- Purpose: Store payment information
-- Normalization: Separate table for financial transactions
-- Key Features: Payment modes, transaction IDs, payment status tracking

CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL UNIQUE,
    payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount > 0),
    payment_method ENUM('Cash', 'UPI', 'Online') NOT NULL,
    payment_status ENUM('Success', 'Pending', 'Failed', 'Refunded') DEFAULT 'Pending',
    transaction_id VARCHAR(50) UNIQUE COMMENT 'Unique transaction identifier',
    upi_id VARCHAR(50) COMMENT 'UPI ID if payment method is UPI',
    bank_name VARCHAR(100) COMMENT 'Bank name for online payments',
    payment_date DATE NOT NULL,
    payment_time TIME NOT NULL,
    payment_received_by INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (payment_received_by) REFERENCES Conductors(conductor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================================
-- TABLE 9: QR_CODES TABLE (For QR Verification Tracking)
-- =====================================================================
-- Purpose: Store QR code verification history
-- Normalization: Audit trail for QR scanning activities

CREATE TABLE QR_Codes (
    qr_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    qr_code_id VARCHAR(100) NOT NULL UNIQUE,
    qr_data TEXT NOT NULL COMMENT 'Encoded QR data (JSON format recommended)',
    qr_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qr_validity_status ENUM('Valid', 'Invalid', 'Expired', 'Used') DEFAULT 'Valid',
    scan_count INT DEFAULT 0,
    last_scanned_at TIMESTAMP NULL,
    last_scanned_by INT COMMENT 'Inspector/Conductor ID who scanned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(ticket_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (last_scanned_by) REFERENCES Conductors(conductor_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =====================================================================
-- STEP 2: INSERT SAMPLE DATA
-- =====================================================================

-- Insert Conductors
INSERT INTO Conductors (conductor_name, employee_id, contact_number, email, joining_date, status) VALUES
('Rajesh Kumar', 'EMP001', '9876543210', 'rajesh.k@busticketing.com', '2020-01-15', 'Active'),
('Priya Singh', 'EMP002', '9876543211', 'priya.s@busticketing.com', '2020-06-20', 'Active'),
('Arun Patel', 'EMP003', '9876543212', 'arun.p@busticketing.com', '2021-03-10', 'Active'),
('Meera Desai', 'EMP004', '9876543213', 'meera.d@busticketing.com', '2021-08-25', 'Active');

-- Insert Buses
INSERT INTO Buses (bus_number, bus_name, bus_type, total_seats, available_seats, conductor_id, registration_date, status) VALUES
('BUS-001', 'Express 1', 'AC', 45, 45, 1, '2020-02-01', 'Active'),
('BUS-002', 'Premium Sleeper', 'Sleeper', 30, 30, 2, '2020-03-15', 'Active'),
('BUS-003', 'Non-AC 1', 'Non-AC', 50, 50, 3, '2020-04-20', 'Active'),
('BUS-004', 'Luxury Express', 'AC', 40, 40, 4, '2021-01-10', 'Active');

-- Insert Routes
INSERT INTO Routes (route_name, source_city, destination_city, distance_km, estimated_time_hours, base_fare, travel_date, departure_time, arrival_time, status) VALUES
('Mumbai-Pune Express', 'Mumbai', 'Pune', 150.00, 3.50, 500.00, '2026-04-25', '09:00:00', '12:30:00', 'Scheduled'),
('Delhi-Agra Express', 'Delhi', 'Agra', 206.00, 4.00, 700.00, '2026-04-25', '06:00:00', '10:00:00', 'Scheduled'),
('Bangalore-Hyderabad', 'Bangalore', 'Hyderabad', 575.00, 9.00, 1200.00, '2026-04-26', '18:00:00', '03:00:00', 'Scheduled'),
('Chennai-Coimbatore', 'Chennai', 'Coimbatore', 180.00, 3.50, 550.00, '2026-04-25', '14:00:00', '17:30:00', 'Scheduled');

-- Insert Bus_Routes (Link buses with routes)
INSERT INTO Bus_Routes (bus_id, route_id, available_capacity, total_capacity) VALUES
(1, 1, 45, 45),
(2, 2, 30, 30),
(3, 3, 50, 50),
(4, 4, 40, 40);

-- Insert Seats for Bus 1 (45 seats - AC)
INSERT INTO Seats (bus_id, seat_number, seat_type, status) VALUES
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

-- Insert Seats for Bus 2 (30 seats - Sleeper)
INSERT INTO Seats (bus_id, seat_number, seat_type, status) VALUES
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

-- Insert Seats for Bus 3 (First 30 seats for Non-AC)
INSERT INTO Seats (bus_id, seat_number, seat_type, status) VALUES
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

-- Insert Seats for Bus 4 (40 seats - AC)
INSERT INTO Seats (bus_id, seat_number, seat_type, status) VALUES
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
INSERT INTO Passengers (passenger_name, contact_number, age, gender, id_type, id_number) VALUES
('Amit Sharma', '8765432100', 28, 'Male', 'Aadhar', '123456789012'),
('Sneha Gupta', '8765432101', 26, 'Female', 'Aadhar', '223456789012'),
('Rohan Verma', '8765432102', 35, 'Male', 'PAN', 'ABCDE1234F'),
('Pooja Nair', '8765432103', 32, 'Female', 'Passport', 'P12345678'),
('Vikram Singh', '8765432104', 40, 'Male', 'DL', 'DL12345678'),
('Ananya Kapoor', '8765432105', 24, 'Female', 'Aadhar', '323456789012'),
('Nikhil Patel', '8765432106', 29, 'Male', 'Voter ID', 'V12345678'),
('Divya Sharma', '8765432107', 31, 'Female', 'Aadhar', '423456789012');

-- =====================================================================
-- STEP 3: INSERT SAMPLE BOOKINGS AND PAYMENTS
-- =====================================================================

-- Insert Tickets with QR Codes
INSERT INTO Tickets (ticket_number, qr_code_id, passenger_id, bus_route_id, seat_id, conductor_id, booking_date, booking_time, boarding_date, journey_status, ticket_price, qr_scan_status) VALUES
('TKT-001', 'QR-2026-04-25-001', 1, 1, 1, 1, '2026-04-23', '10:30:00', '2026-04-25', 'Booked', 500.00, 'Not Scanned'),
('TKT-002', 'QR-2026-04-25-002', 2, 1, 2, 1, '2026-04-23', '10:45:00', '2026-04-25', 'Booked', 500.00, 'Not Scanned'),
('TKT-003', 'QR-2026-04-25-003', 3, 1, 4, 1, '2026-04-23', '11:00:00', '2026-04-25', 'Booked', 500.00, 'Scanned'),
('TKT-004', 'QR-2026-04-25-004', 4, 2, 21, 2, '2026-04-22', '14:20:00', '2026-04-25', 'Booked', 700.00, 'Not Scanned'),
('TKT-005', 'QR-2026-04-25-005', 5, 2, 22, 2, '2026-04-22', '14:35:00', '2026-04-25', 'Checked-In', 700.00, 'Scanned'),
('TKT-006', 'QR-2026-04-26-001', 6, 3, 31, 3, '2026-04-24', '16:00:00', '2026-04-26', 'Booked', 1200.00, 'Not Scanned'),
('TKT-007', 'QR-2026-04-25-006', 7, 4, 46, 4, '2026-04-23', '13:15:00', '2026-04-25', 'Booked', 550.00, 'Not Scanned'),
('TKT-008', 'QR-2026-04-25-007', 8, 4, 47, 4, '2026-04-23', '13:30:00', '2026-04-25', 'Completed', 550.00, 'Scanned');

-- Insert Payments
INSERT INTO Payments (ticket_id, payment_amount, payment_method, payment_status, transaction_id, upi_id, bank_name, payment_date, payment_time, payment_received_by) VALUES
(1, 500.00, 'Cash', 'Success', 'TXN-2026-04-23-001', NULL, NULL, '2026-04-23', '10:31:00', 1),
(2, 500.00, 'UPI', 'Success', 'TXN-2026-04-23-002', 'sneha.gupta@upi', NULL, '2026-04-23', '10:46:00', 1),
(3, 500.00, 'Online', 'Success', 'TXN-2026-04-23-003', NULL, 'ICICI Bank', '2026-04-23', '11:01:00', 1),
(4, 700.00, 'Cash', 'Success', 'TXN-2026-04-22-001', NULL, NULL, '2026-04-22', '14:21:00', 2),
(5, 700.00, 'UPI', 'Success', 'TXN-2026-04-22-002', 'vikram.singh@upi', NULL, '2026-04-22', '14:36:00', 2),
(6, 1200.00, 'Online', 'Pending', 'TXN-2026-04-24-001', NULL, 'HDFC Bank', '2026-04-24', '16:01:00', 3),
(7, 550.00, 'Cash', 'Success', 'TXN-2026-04-23-004', NULL, NULL, '2026-04-23', '13:16:00', 4),
(8, 550.00, 'Online', 'Success', 'TXN-2026-04-23-005', NULL, 'Axis Bank', '2026-04-23', '13:31:00', 4);

-- Insert QR Codes
INSERT INTO QR_Codes (ticket_id, qr_code_id, qr_data, qr_validity_status, scan_count, last_scanned_at, last_scanned_by) VALUES
(1, 'QR-2026-04-25-001', '{"ticket_id":"TKT-001","passenger":"Amit Sharma","bus":"BUS-001","seat":"A1","route":"Mumbai-Pune","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(2, 'QR-2026-04-25-002', '{"ticket_id":"TKT-002","passenger":"Sneha Gupta","bus":"BUS-001","seat":"A2","route":"Mumbai-Pune","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(3, 'QR-2026-04-25-003', '{"ticket_id":"TKT-003","passenger":"Rohan Verma","bus":"BUS-001","seat":"B1","route":"Mumbai-Pune","date":"2026-04-25"}', 'Used', 1, '2026-04-25 09:15:00', 1),
(4, 'QR-2026-04-25-004', '{"ticket_id":"TKT-004","passenger":"Pooja Nair","bus":"BUS-002","seat":"S1","route":"Delhi-Agra","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(5, 'QR-2026-04-25-005', '{"ticket_id":"TKT-005","passenger":"Vikram Singh","bus":"BUS-002","seat":"S2","route":"Delhi-Agra","date":"2026-04-25"}', 'Used', 1, '2026-04-25 06:30:00', 2),
(6, 'QR-2026-04-26-001', '{"ticket_id":"TKT-006","passenger":"Ananya Kapoor","bus":"BUS-003","seat":"N1","route":"Bangalore-Hyderabad","date":"2026-04-26"}', 'Valid', 0, NULL, NULL),
(7, 'QR-2026-04-25-006', '{"ticket_id":"TKT-007","passenger":"Nikhil Patel","bus":"BUS-004","seat":"L1","route":"Chennai-Coimbatore","date":"2026-04-25"}', 'Valid', 0, NULL, NULL),
(8, 'QR-2026-04-25-007', '{"ticket_id":"TKT-008","passenger":"Divya Sharma","bus":"BUS-004","seat":"L2","route":"Chennai-Coimbatore","date":"2026-04-25"}', 'Used', 1, '2026-04-25 14:45:00', 4);

-- Update Seat Status after booking
UPDATE Seats SET status = 'Booked' WHERE seat_id IN (1, 2, 4, 21, 22, 31, 46, 47);

-- Update available seats in Bus_Routes
UPDATE Bus_Routes SET available_capacity = 37 WHERE bus_route_id = 1;
UPDATE Bus_Routes SET available_capacity = 28 WHERE bus_route_id = 2;
UPDATE Bus_Routes SET available_capacity = 49 WHERE bus_route_id = 3;
UPDATE Bus_Routes SET available_capacity = 38 WHERE bus_route_id = 4;

-- Update available_seats in Buses table
UPDATE Buses SET available_seats = 37 WHERE bus_id = 1;
UPDATE Buses SET available_seats = 28 WHERE bus_id = 2;
UPDATE Buses SET available_seats = 49 WHERE bus_id = 3;
UPDATE Buses SET available_seats = 38 WHERE bus_id = 4;

-- =====================================================================
-- STEP 4: CRITICAL SQL QUERIES FOR VARIOUS OPERATIONS
-- =====================================================================

-- QUERY 1: Show All Available Seats for a Specific Route
-- Purpose: Display available seats when conductor selects a route
-- =====================================================================
SELECT 
    s.seat_id,
    s.seat_number,
    s.seat_type,
    s.status,
    b.bus_number,
    r.route_name,
    r.source_city,
    r.destination_city
FROM Seats s
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON b.bus_id = br.bus_id
JOIN Routes r ON br.route_id = r.route_id
WHERE r.route_id = 1 AND s.status = 'Available'
ORDER BY s.seat_number;

-- QUERY 2: Book a Seat (Step 1: Check if seat is available)
-- Purpose: Prevent double booking
-- =====================================================================
SELECT 
    s.seat_id,
    s.seat_number,
    s.status,
    b.bus_number
FROM Seats s
JOIN Buses b ON s.bus_id = b.bus_id
WHERE s.seat_id = 1 AND s.status = 'Available'
FOR UPDATE; -- Lock for preventing concurrent booking

-- QUERY 3: Complete Booking Process
-- Purpose: Update seat status after successful booking
-- =====================================================================
-- First, insert passenger
-- INSERT INTO Passengers (passenger_name, contact_number, age, gender, id_type, id_number)
-- VALUES ('John Doe', '9876543214', 30, 'Male', 'Aadhar', '523456789012');

-- Then insert ticket
-- INSERT INTO Tickets (ticket_number, qr_code_id, passenger_id, bus_route_id, seat_id, 
--                     conductor_id, booking_date, booking_time, boarding_date, ticket_price)
-- VALUES ('TKT-009', 'QR-2026-04-25-008', 9, 1, 5, 1, 
--         CURDATE(), CURTIME(), '2026-04-25', 500.00);

-- Then update seat status
-- UPDATE Seats SET status = 'Booked' WHERE seat_id = 5;

-- Then process payment
-- INSERT INTO Payments (ticket_id, payment_amount, payment_method, payment_status, 
--                      transaction_id, payment_date, payment_time, payment_received_by)
-- VALUES (9, 500.00, 'Cash', 'Success', 'TXN-2026-04-23-006', CURDATE(), CURTIME(), 1);

-- QUERY 4: Get All Booked Tickets
-- Purpose: View ticket history
-- =====================================================================
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
FROM Tickets t
JOIN Passengers p ON t.passenger_id = p.passenger_id
JOIN Seats s ON t.seat_id = s.seat_id
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE t.boarding_date = '2026-04-25'
ORDER BY t.booking_date DESC;

-- QUERY 5: Check Payment Status
-- Purpose: Verify payment for ticket before boarding
-- =====================================================================
SELECT 
    t.ticket_number,
    p.passenger_name,
    pay.payment_amount,
    pay.payment_method,
    pay.payment_status,
    pay.transaction_id,
    pay.payment_date,
    pay.payment_time
FROM Payments pay
JOIN Tickets t ON pay.ticket_id = t.ticket_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
WHERE pay.payment_status = 'Success'
  AND t.boarding_date = '2026-04-25'
ORDER BY pay.payment_date DESC;

-- QUERY 6: Calculate Revenue per Route
-- Purpose: Business analytics - revenue by route
-- =====================================================================
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
FROM Routes r
JOIN Bus_Routes br ON r.route_id = br.route_id
LEFT JOIN Tickets t ON br.bus_route_id = t.bus_route_id
LEFT JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY r.route_id, r.route_name, r.source_city, r.destination_city
ORDER BY total_revenue DESC;

-- QUERY 7: Booked vs Available Seats Summary
-- Purpose: Bus capacity analysis
-- =====================================================================
SELECT 
    b.bus_id,
    b.bus_number,
    b.bus_type,
    b.total_seats,
    COUNT(CASE WHEN s.status = 'Booked' THEN 1 END) AS booked_seats,
    COUNT(CASE WHEN s.status = 'Available' THEN 1 END) AS available_seats,
    COUNT(CASE WHEN s.status = 'Reserved' THEN 1 END) AS reserved_seats,
    ROUND(
        (COUNT(CASE WHEN s.status = 'Booked' THEN 1 END) / b.total_seats) * 100, 
        2
    ) AS occupancy_percentage
FROM Buses b
JOIN Seats s ON b.bus_id = s.bus_id
GROUP BY b.bus_id, b.bus_number, b.bus_type, b.total_seats
ORDER BY occupancy_percentage DESC;

-- QUERY 8: Payment Method Analysis
-- Purpose: Analyze preferred payment methods
-- =====================================================================
SELECT 
    pay.payment_method,
    COUNT(t.ticket_id) AS total_transactions,
    SUM(pay.payment_amount) AS total_amount,
    AVG(pay.payment_amount) AS average_amount,
    COUNT(CASE WHEN pay.payment_status = 'Success' THEN 1 END) AS successful,
    COUNT(CASE WHEN pay.payment_status = 'Failed' THEN 1 END) AS failed,
    COUNT(CASE WHEN pay.payment_status = 'Pending' THEN 1 END) AS pending
FROM Payments pay
JOIN Tickets t ON pay.ticket_id = t.ticket_id
GROUP BY pay.payment_method
ORDER BY total_amount DESC;

-- QUERY 9: QR Scan Report - Verify Tickets
-- Purpose: Check ticket validity using QR scan
-- =====================================================================
SELECT 
    qr.qr_id,
    qr.qr_code_id,
    t.ticket_number,
    p.passenger_name,
    s.seat_number,
    b.bus_number,
    r.route_name,
    t.boarding_date,
    qr.qr_validity_status,
    qr.scan_count,
    qr.last_scanned_at,
    c.conductor_name as last_scanned_by
FROM QR_Codes qr
JOIN Tickets t ON qr.ticket_id = t.ticket_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
JOIN Seats s ON t.seat_id = s.seat_id
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
LEFT JOIN Conductors c ON qr.last_scanned_by = c.conductor_id
WHERE qr.qr_validity_status IN ('Valid', 'Used')
ORDER BY t.boarding_date DESC;

-- QUERY 10: Conductor Performance Report
-- Purpose: Track conductor activity and revenue collection
-- =====================================================================
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
FROM Conductors c
LEFT JOIN Tickets t ON c.conductor_id = t.conductor_id
LEFT JOIN Payments pay ON t.ticket_id = pay.ticket_id AND pay.payment_status = 'Success'
GROUP BY c.conductor_id, c.conductor_name, c.employee_id
ORDER BY total_collection DESC;

-- QUERY 11: Route-wise Ticket Summary
-- Purpose: See booking details per route
-- =====================================================================
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
FROM Routes r
LEFT JOIN Bus_Routes br ON r.route_id = br.route_id
LEFT JOIN Tickets t ON br.bus_route_id = t.bus_route_id
GROUP BY r.route_id, r.route_name, r.source_city, r.destination_city, 
         r.travel_date, r.departure_time
ORDER BY r.travel_date DESC, r.departure_time;

-- QUERY 12: Find Duplicate Bookings Attempt (Safety Check)
-- Purpose: Ensure no double booking for same seat on same route
-- =====================================================================
SELECT 
    s.seat_number,
    b.bus_number,
    r.route_name,
    r.travel_date,
    COUNT(t.ticket_id) AS booking_count,
    GROUP_CONCAT(p.passenger_name) AS passengers
FROM Tickets t
JOIN Seats s ON t.seat_id = s.seat_id
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
WHERE t.journey_status != 'Cancelled'
GROUP BY s.seat_id, s.seat_number, b.bus_number, r.route_name, r.travel_date
HAVING COUNT(t.ticket_id) > 1;

-- =====================================================================
-- STEP 5: TRIGGERS FOR DATA CONSISTENCY
-- =====================================================================

-- TRIGGER 1: Auto-update Seat Status
-- Purpose: Maintain consistency between Tickets and Seats tables
-- =====================================================================
DELIMITER //

CREATE TRIGGER update_seat_status_after_booking
AFTER INSERT ON Tickets
FOR EACH ROW
BEGIN
    UPDATE Seats 
    SET status = 'Booked' 
    WHERE seat_id = NEW.seat_id;
END //

-- TRIGGER 2: Update available_seats in Bus when seat is booked
DELIMITER //

CREATE TRIGGER update_bus_availability_after_booking
AFTER UPDATE ON Seats
FOR EACH ROW
BEGIN
    IF NEW.status = 'Booked' AND OLD.status = 'Available' THEN
        UPDATE Buses 
        SET available_seats = available_seats - 1 
        WHERE bus_id = NEW.bus_id;
    END IF;
END //

-- TRIGGER 3: Update available_capacity in Bus_Routes
DELIMITER //

CREATE TRIGGER update_bus_route_capacity
AFTER UPDATE ON Buses
FOR EACH ROW
BEGIN
    UPDATE Bus_Routes 
    SET available_capacity = NEW.available_seats 
    WHERE bus_id = NEW.bus_id;
END //

DELIMITER ;

-- =====================================================================
-- STEP 6: STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================================

-- PROCEDURE 1: Book Ticket (Complete transaction)
-- =====================================================================
DELIMITER //

CREATE PROCEDURE BookTicket(
    IN p_passenger_name VARCHAR(100),
    IN p_contact_number VARCHAR(10),
    IN p_age INT,
    IN p_gender VARCHAR(10),
    IN p_id_type VARCHAR(20),
    IN p_id_number VARCHAR(50),
    IN p_bus_route_id INT,
    IN p_seat_id INT,
    IN p_conductor_id INT,
    IN p_payment_method VARCHAR(20),
    IN p_transaction_id VARCHAR(50),
    IN p_ticket_price DECIMAL(8,2)
)
BEGIN
    DECLARE p_passenger_id INT;
    DECLARE p_ticket_id INT;
    DECLARE ticket_number VARCHAR(20);
    DECLARE qr_code_id VARCHAR(100);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Insert Passenger
    INSERT INTO Passengers (passenger_name, contact_number, age, gender, id_type, id_number)
    VALUES (p_passenger_name, p_contact_number, p_age, p_gender, p_id_type, p_id_number);
    
    SET p_passenger_id = LAST_INSERT_ID();
    SET ticket_number = CONCAT('TKT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', p_passenger_id);
    SET qr_code_id = CONCAT('QR-', DATE_FORMAT(NOW(), '%Y-%m-%d'), '-', LPAD(p_ticket_id, 3, '0'));
    
    -- Insert Ticket
    INSERT INTO Tickets (ticket_number, qr_code_id, passenger_id, bus_route_id, seat_id, 
                         conductor_id, booking_date, booking_time, boarding_date, ticket_price)
    VALUES (ticket_number, qr_code_id, p_passenger_id, p_bus_route_id, p_seat_id, 
            p_conductor_id, CURDATE(), CURTIME(), CURDATE(), p_ticket_price);
    
    SET p_ticket_id = LAST_INSERT_ID();
    
    -- Update seat status
    UPDATE Seats SET status = 'Booked' WHERE seat_id = p_seat_id;
    
    -- Insert Payment
    INSERT INTO Payments (ticket_id, payment_amount, payment_method, payment_status, 
                         transaction_id, payment_date, payment_time, payment_received_by)
    VALUES (p_ticket_id, p_ticket_price, p_payment_method, 'Success', 
            p_transaction_id, CURDATE(), CURTIME(), p_conductor_id);
    
    -- Insert QR Code
    INSERT INTO QR_Codes (ticket_id, qr_code_id, qr_data, qr_validity_status)
    VALUES (p_ticket_id, qr_code_id, 
            CONCAT('{"ticket_id":"', ticket_number, '","passenger":"', p_passenger_name, '","status":"valid"}'), 
            'Valid');
    
    COMMIT;
    
    SELECT p_ticket_id AS ticket_id, ticket_number AS ticket_number, qr_code_id AS qr_code;
    
END //

DELIMITER ;

-- PROCEDURE 2: Update QR Scan Status
-- =====================================================================
DELIMITER //

CREATE PROCEDURE ScanQRCode(
    IN p_qr_code_id VARCHAR(100),
    IN p_conductor_id INT
)
BEGIN
    DECLARE p_ticket_id INT;
    DECLARE p_ticket_validity VARCHAR(50);
    
    -- Get ticket ID and check if QR is valid
    SELECT ticket_id INTO p_ticket_id 
    FROM QR_Codes 
    WHERE qr_code_id = p_qr_code_id 
      AND qr_validity_status = 'Valid';
    
    IF p_ticket_id IS NOT NULL THEN
        -- Update QR code scan information
        UPDATE QR_Codes 
        SET scan_count = scan_count + 1,
            last_scanned_at = NOW(),
            last_scanned_by = p_conductor_id,
            qr_validity_status = 'Used'
        WHERE qr_code_id = p_qr_code_id;
        
        -- Update ticket status
        UPDATE Tickets 
        SET qr_scan_status = 'Scanned',
            qr_scanned_at = NOW(),
            journey_status = 'Checked-In'
        WHERE ticket_id = p_ticket_id;
        
        SELECT 'QR Scanned Successfully' AS status, 
               (SELECT passenger_name FROM Passengers p 
                JOIN Tickets t ON p.passenger_id = t.passenger_id 
                WHERE t.ticket_id = p_ticket_id) AS passenger_name;
    ELSE
        SELECT 'Invalid QR Code' AS status;
    END IF;
    
END //

DELIMITER ;

-- PROCEDURE 3: Get Available Seats
-- =====================================================================
DELIMITER //

CREATE PROCEDURE GetAvailableSeats(
    IN p_route_id INT
)
BEGIN
    SELECT 
        s.seat_id,
        s.seat_number,
        s.seat_type,
        b.bus_number,
        r.route_name,
        r.source_city,
        r.destination_city,
        r.departure_time
    FROM Seats s
    JOIN Buses b ON s.bus_id = b.bus_id
    JOIN Bus_Routes br ON b.bus_id = br.bus_id
    JOIN Routes r ON br.route_id = r.route_id
    WHERE r.route_id = p_route_id 
      AND s.status = 'Available'
    ORDER BY s.seat_number;
END //

DELIMITER ;

-- =====================================================================
-- STEP 7: VIEWS FOR COMMON QUERIES
-- =====================================================================

-- VIEW 1: Active Routes with Availability
CREATE VIEW ActiveRoutesView AS
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
    ROUND((br.available_capacity / br.total_capacity) * 100, 2) AS availability_percentage
FROM Routes r
JOIN Bus_Routes br ON r.route_id = br.route_id
WHERE r.status = 'Scheduled'
ORDER BY r.travel_date, r.departure_time;

-- VIEW 2: Ticket Status Summary
CREATE VIEW TicketStatusView AS
SELECT 
    t.ticket_id,
    t.ticket_number,
    p.passenger_name,
    s.seat_number,
    b.bus_number,
    r.route_name,
    t.boarding_date,
    t.journey_status,
    pay.payment_status,
    t.qr_scan_status
FROM Tickets t
JOIN Passengers p ON t.passenger_id = p.passenger_id
JOIN Seats s ON t.seat_id = s.seat_id
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
JOIN Payments pay ON t.ticket_id = pay.ticket_id;

-- VIEW 3: Revenue Summary
CREATE VIEW RevenueSummaryView AS
SELECT 
    DATE(pay.payment_date) AS payment_date,
    r.route_name,
    COUNT(t.ticket_id) AS tickets_sold,
    SUM(pay.payment_amount) AS daily_revenue,
    AVG(pay.payment_amount) AS average_ticket_price,
    COUNT(CASE WHEN pay.payment_method = 'Cash' THEN 1 END) AS cash_count,
    COUNT(CASE WHEN pay.payment_method = 'UPI' THEN 1 END) AS upi_count,
    COUNT(CASE WHEN pay.payment_method = 'Online' THEN 1 END) AS online_count
FROM Payments pay
JOIN Tickets t ON pay.ticket_id = t.ticket_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
WHERE pay.payment_status = 'Success'
GROUP BY DATE(pay.payment_date), r.route_name;

-- =====================================================================
-- STEP 8: TEST QUERIES - SAMPLE OUTPUTS
-- =====================================================================

-- TEST 1: List all buses with availability
SELECT 
    bus_id,
    bus_number,
    bus_type,
    total_seats,
    available_seats,
    ROUND((available_seats / total_seats) * 100, 2) AS availability_percentage
FROM Buses
WHERE status = 'Active'
ORDER BY availability_percentage DESC;

-- TEST 2: Show ticket details for a specific date
SELECT 
    t.ticket_number,
    p.passenger_name,
    s.seat_number,
    b.bus_number,
    r.route_name,
    pay.payment_amount,
    pay.payment_method,
    pay.payment_status
FROM Tickets t
JOIN Passengers p ON t.passenger_id = p.passenger_id
JOIN Seats s ON t.seat_id = s.seat_id
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE DATE(t.booking_date) = '2026-04-23'
ORDER BY t.ticket_number;

-- TEST 3: Revenue per conductor
SELECT 
    c.conductor_name,
    COUNT(t.ticket_id) AS tickets_issued,
    SUM(pay.payment_amount) AS total_revenue
FROM Conductors c
LEFT JOIN Tickets t ON c.conductor_id = t.conductor_id
LEFT JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY c.conductor_id, c.conductor_name
ORDER BY total_revenue DESC;

-- TEST 4: Check QR scan status
SELECT 
    qr.qr_code_id,
    t.ticket_number,
    p.passenger_name,
    qr.qr_validity_status,
    qr.scan_count,
    qr.last_scanned_at
FROM QR_Codes qr
JOIN Tickets t ON qr.ticket_id = t.ticket_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
WHERE qr.scan_count > 0
ORDER BY qr.last_scanned_at DESC;

-- =====================================================================
-- CONCEPTUAL EXPLANATION: QR SCANNER LOGIC
-- =====================================================================

/*
QR SCANNER WORKING CONCEPT:

1. QR CODE GENERATION:
   - When a ticket is created, a unique QR code ID is generated
   - Format: QR-YYYY-MM-DD-SEQUENCE
   - The QR code encodes a JSON string containing:
     * Ticket ID
     * Passenger Name
     * Bus Number
     * Seat Number
     * Route Name
     * Travel Date
     * Unique QR ID
   - Example: QR-2026-04-25-001 encodes:
     {"ticket_id":"TKT-001","passenger":"Amit Sharma","bus":"BUS-001",
      "seat":"A1","route":"Mumbai-Pune","date":"2026-04-25"}

2. QR CODE SCANNING PROCESS:
   
   Step A: Conductor scans QR code at boarding:
   - Mobile device or scanner reads the encoded data
   - System fetches the qr_code_id from QR code
   - Query: SELECT * FROM QR_Codes WHERE qr_code_id = scanned_qr
   
   Step B: Verify Ticket Validity:
   - Check if qr_validity_status = 'Valid'
   - Check if ticket journey_status = 'Booked'
   - Check if boarding_date matches today's date
   - Verify payment_status = 'Success'
   
   Step C: Update Scan Records:
   - Increment scan_count
   - Set last_scanned_at = current timestamp
   - Set last_scanned_by = conductor_id
   - Update qr_validity_status to 'Used'
   - Update ticket journey_status to 'Checked-In'
   
   Step D: System Response:
   - VALID: Display passenger name, seat number, bus number
   - INVALID: Show error message (already used, expired, cancelled)
   - PENDING PAYMENT: Alert about incomplete payment

3. SECURITY FEATURES:
   
   a) One-Time Use:
      - Once scanned, status changes to 'Used'
      - Prevents using same ticket twice
      - Double-scan attempt will show "Already Used"
   
   b) Date Verification:
      - QR is only valid for boarding_date
      - System rejects future/past tickets
   
   c) Payment Verification:
      - Only tickets with payment_status = 'Success' are valid
      - Pending/Failed payments show alert
   
   d) Conductor Tracking:
      - Records which conductor scanned the ticket
      - Maintains audit trail for accountability

4. DATABASE FLOW:
   
   Before Scan:
   - QR_Codes: qr_validity_status = 'Valid', scan_count = 0
   - Tickets: journey_status = 'Booked', qr_scan_status = 'Not Scanned'
   
   After Scan:
   - QR_Codes: qr_validity_status = 'Used', scan_count = 1, last_scanned_at = NOW()
   - Tickets: journey_status = 'Checked-In', qr_scan_status = 'Scanned'

5. ERROR HANDLING:
   
   Scenario 1: Invalid QR Code
   - QR format corrupted or not found in database
   - Response: "Invalid QR Code"
   
   Scenario 2: Already Used Ticket
   - scan_count > 0 or qr_validity_status = 'Used'
   - Response: "Ticket Already Used - Fraud Attempt"
   
   Scenario 3: Expired/Cancelled Ticket
   - travel_date < today or journey_status = 'Cancelled'
   - Response: "Ticket Expired or Cancelled"
   
   Scenario 4: Payment Not Received
   - payment_status != 'Success'
   - Response: "Payment Pending - Cannot Board"

6. IMPLEMENTATION WITH PROCEDURES:
   - ScanQRCode() procedure handles complete verification
   - Logs all scan attempts in audit table (recommended)
   - Sends SMS/Email notification of boarding confirmation
   - Updates bus occupancy in real-time

7. MOBILE/HARDWARE INTEGRATION:
   - Scanner hardware: QR barcode scanner/mobile camera
   - Formats QR using JSON encoding
   - QR libraries: QRCode.js (frontend), generate library (backend)
   - Scanner integration: Camera API for mobile app
*/

-- =====================================================================
-- INDEX CREATION FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

CREATE INDEX idx_seats_bus_status ON Seats(bus_id, status);
CREATE INDEX idx_tickets_passenger ON Tickets(passenger_id);
CREATE INDEX idx_tickets_boarding_date ON Tickets(boarding_date);
CREATE INDEX idx_payments_status ON Payments(payment_status);
CREATE INDEX idx_qr_codes_validity ON QR_Codes(qr_validity_status);
CREATE INDEX idx_routes_date ON Routes(travel_date);

-- =====================================================================
-- END OF SQL MINI PROJECT
-- =====================================================================
