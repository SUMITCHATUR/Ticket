# Quick Reference Guide & Implementation Steps
## Smart Bus Ticket Booking System

---

## 🔄 ENTITY RELATIONSHIP DIAGRAM (TEXT FORMAT)

```
┌─────────────────┐
│   CONDUCTORS    │
│  (conductor_id) │◄────────┐
└─────────────────┘         │
        │                   │
        ├──(PK)─────────────┼──────────────────────┐
        │                   │                      │
        └──(FK)────┐        │                      │
                   │        │                      │
     ┌─────────────▼──┐   ┌─▼──────────────┐    ┌──▼───────────┐
     │     BUSES       │   │ BUS_ROUTES     │    │  TICKETS     │
     │    (bus_id)     │   │(bus_route_id)  │    │(ticket_id)   │
     └─────────────────┘   └────────────────┘    └──────────────┘
           │  │                   │ │                 │ │ │ │
           │  │◄──(FK)────────────┘ │                 │ │ │ │
           │  │                     │                 │ │ │ │
      ┌────▼──▼──┐          ┌───────▼┐       ┌──────▼─┤ │ │
      │   SEATS   │          │ ROUTES │       │PASSENGERS  │ │
      │(seat_id)  │          │(route_id)      │(passenger_id) │
      └───────────┘          └────────┘       └──────────────┘
              │                                       │
              │                        ┌──────────────┘
              └────────────┬───────────┤
                           │           │
                        ┌──▼────┐   ┌──▼────────┐
                        │PAYMENTS│   │ QR_CODES  │
                        └────────┘   └───────────┘
```

---

## 📊 TABLE RELATIONSHIP SUMMARY

```
CONDUCTORS (1) ─────► (Many) BUSES
CONDUCTORS (1) ─────► (Many) TICKETS
CONDUCTORS (1) ─────► (Many) PAYMENTS
CONDUCTORS (1) ─────► (Many) QR_CODES

BUSES (1) ──────► (Many) SEATS
BUSES (1) ──────► (Many) BUS_ROUTES
BUSES (1) ──────► (Many) TICKETS (via BUS_ROUTES)

ROUTES (1) ──────► (Many) BUS_ROUTES
BUS_ROUTES (1) ──────► (Many) TICKETS

PASSENGERS (1) ──────► (Many) TICKETS

SEATS (1) ──────► (Many) TICKETS

TICKETS (1) ──────► (One) PAYMENTS
TICKETS (1) ──────► (One) QR_CODES
```

---

## 🚀 STEP-BY-STEP IMPLEMENTATION

### Step 1: Create Database
```sql
CREATE DATABASE BusTicketSystem;
USE BusTicketSystem;
```

### Step 2: Run Complete SQL File
```bash
# In MySQL Command Line
mysql -u root -p BusTicketSystem < bus_ticket_system.sql

# OR in any SQL IDE (MySQL Workbench, DataGrip, etc.)
-- Open the SQL file
-- Execute all queries
```

### Step 3: Verify Database Creation
```sql
-- Check all tables are created
SHOW TABLES;

-- Expected output:
-- Buses
-- Bus_Routes
-- Conductors
-- Passengers
-- Payments
-- QR_Codes
-- Routes
-- Seats
-- Tickets
```

### Step 4: Verify Sample Data
```sql
-- Check if data is inserted
SELECT COUNT(*) FROM Conductors;      -- Should return 4
SELECT COUNT(*) FROM Buses;           -- Should return 4
SELECT COUNT(*) FROM Routes;          -- Should return 4
SELECT COUNT(*) FROM Passengers;      -- Should return 8
SELECT COUNT(*) FROM Tickets;         -- Should return 8
SELECT COUNT(*) FROM Payments;        -- Should return 8
```

---

## 💼 DAILY OPERATIONS WORKFLOW

### Morning: Start of Day
```sql
-- 1. Check available routes for today
SELECT r.route_id, r.route_name, r.departure_time, 
       br.available_capacity, b.bus_number
FROM Routes r
JOIN Bus_Routes br ON r.route_id = br.route_id
JOIN Buses b ON br.bus_id = b.bus_id
WHERE DATE(r.travel_date) = CURDATE()
  AND r.status = 'Scheduled'
ORDER BY r.departure_time;

-- 2. Verify all buses are active
SELECT bus_id, bus_number, available_seats
FROM Buses
WHERE status = 'Active'
ORDER BY bus_number;
```

### During Day: Booking Tickets
```sql
-- Conductor opens the booking system

-- Step 1: Passenger provides details
-- Step 2: Conductor selects route
SELECT * FROM Routes WHERE status = 'Scheduled'

-- Step 3: Show available seats for selected route
CALL GetAvailableSeats(1);  -- route_id = 1

-- Step 4: Conductor selects seat and processes payment
-- Use BookTicket stored procedure
CALL BookTicket(
  'Amit Sharma',
  '9876543210',
  28,
  'Male',
  'Aadhar',
  '123456789012',
  1,     -- bus_route_id
  1,     -- seat_id
  1,     -- conductor_id
  'Cash',
  'TXN-001',
  500.00
);

-- Result: Ticket number and QR code displayed
```

### At Boarding Gate: QR Verification
```sql
-- Conductor scans passenger's QR code
CALL ScanQRCode('QR-2026-04-25-001', 1);

-- Returns: Passenger name and boarding confirmation
-- OR error message if QR is invalid
```

### Evening: Generate Reports
```sql
-- 1. Daily revenue report
SELECT 
    DATE(payment_date) as date,
    COUNT(*) as tickets,
    SUM(payment_amount) as revenue
FROM Payments
WHERE payment_status = 'Success'
GROUP BY DATE(payment_date);

-- 2. Bus occupancy
SELECT bus_number, 
       total_seats - available_seats as booked,
       available_seats,
       ROUND(((total_seats - available_seats)/total_seats)*100, 2) as occupancy_pct
FROM Buses
WHERE status = 'Active';
```

---

## 🎫 COMPLETE BOOKING EXAMPLE

### Scenario: Book ticket for Amit Sharma

```sql
-- INPUT FROM CONDUCTOR INTERFACE:
-- Route: Mumbai-Pune (route_id = 1)
-- Passenger: Amit Sharma, Contact: 9876543210, Age: 28, M
-- ID: Aadhar - 123456789012
-- Seat: A1 (seat_id = 1)
-- Payment: Cash - Success
-- Conductor: Rajesh Kumar (conductor_id = 1)

-- BACKEND EXECUTION:
CALL BookTicket(
  'Amit Sharma',
  '9876543210',
  28,
  'Male',
  'Aadhar',
  '123456789012',
  1,                           -- bus_route_id
  1,                           -- seat_id
  1,                           -- conductor_id
  'Cash',                      -- payment_method
  'TXN-2026-04-23-001',       -- transaction_id
  500.00                       -- ticket_price
);

-- OUTPUT RETURNED:
-- ticket_id: 1
-- ticket_number: TKT-001
-- qr_code: QR-2026-04-25-001

-- DISPLAY TO PASSENGER:
-- ═══════════════════════════════════════
-- ✓ BOOKING CONFIRMED
-- ───────────────────────────────────────
-- Ticket ID: TKT-001
-- Passenger: Amit Sharma
-- Bus: BUS-001 (Express 1 - AC)
-- Seat: A1 (Window)
-- Route: Mumbai-Pune
-- Date: 2026-04-25
-- Time: 09:00 AM
-- Fare: ₹500
-- Payment: Cash
-- ───────────────────────────────────────
-- [QR CODE DISPLAY]
-- ═══════════════════════════════════════

-- AUTOMATIC DATABASE UPDATES:
-- ✓ Seat A1 status: Available → Booked
-- ✓ Bus-001 available_seats: 45 → 44
-- ✓ Route 1 available_capacity: 45 → 44
-- ✓ Passenger record created
-- ✓ Ticket record created
-- ✓ Payment record created (Success)
-- ✓ QR Code record created (Valid)
```

---

## 📱 QR CODE SCANNING EXAMPLE

### Scenario: Passenger boards bus with ticket

```sql
-- AT BOARDING GATE:
-- Conductor scans QR code
-- System reads: QR-2026-04-25-001

CALL ScanQRCode('QR-2026-04-25-001', 1);

-- VERIFICATION CHECKS:
-- ✓ QR exists in database
-- ✓ QR validity status = 'Valid'
-- ✓ Ticket status = 'Booked'
-- ✓ Payment status = 'Success'
-- ✓ Boarding date = Today
-- ✓ Scan count = 0 (first scan)

-- SYSTEM RESPONSE:
-- ═══════════════════════════════════════
-- ✓ TICKET VALID - BOARDING CONFIRMED
-- ───────────────────────────────────────
-- Ticket: TKT-001
-- Passenger: Amit Sharma
-- Seat: A1
-- Bus: BUS-001
-- Status: Checked-In
-- ═══════════════════════════════════════

-- AUTOMATIC UPDATES:
-- ✓ QR validity status: Valid → Used
-- ✓ QR scan_count: 0 → 1
-- ✓ QR last_scanned_at: NOW()
-- ✓ QR last_scanned_by: conductor_id = 1
-- ✓ Ticket journey_status: Booked → Checked-In
-- ✓ Ticket qr_scan_status: Not Scanned → Scanned
-- ✓ Ticket qr_scanned_at: NOW()

-- SECOND ATTEMPT (Fraud Prevention):
CALL ScanQRCode('QR-2026-04-25-001', 1);

-- SYSTEM RESPONSE:
-- ✗ INVALID QR CODE
-- "Ticket Already Used - Fraud Prevention Triggered"
-- Contact Supervisor
```

---

## 📊 ANALYTICS QUERIES

### Query 1: Daily Revenue Report
```sql
SELECT 
    DATE(p.payment_date) as booking_date,
    COUNT(DISTINCT t.ticket_id) as total_tickets,
    SUM(p.payment_amount) as total_revenue,
    AVG(p.payment_amount) as avg_fare,
    COUNT(CASE WHEN p.payment_method='Cash' THEN 1 END) as cash_count,
    COUNT(CASE WHEN p.payment_method='UPI' THEN 1 END) as upi_count,
    COUNT(CASE WHEN p.payment_method='Online' THEN 1 END) as online_count
FROM Payments p
WHERE p.payment_status = 'Success'
GROUP BY DATE(p.payment_date)
ORDER BY booking_date DESC;
```

**Sample Output:**
```
booking_date | total_tickets | total_revenue | avg_fare | cash_count | upi_count | online_count
2026-04-23   | 6            | 3300.00      | 550.00  | 3         | 2        | 1
2026-04-22   | 2            | 1400.00      | 700.00  | 1         | 1        | 0
```

### Query 2: Bus-wise Occupancy
```sql
SELECT 
    b.bus_number,
    b.bus_type,
    COUNT(s.seat_id) as total_seats,
    SUM(CASE WHEN s.status = 'Booked' THEN 1 ELSE 0 END) as booked_seats,
    SUM(CASE WHEN s.status = 'Available' THEN 1 ELSE 0 END) as available_seats,
    ROUND(SUM(CASE WHEN s.status = 'Booked' THEN 1 ELSE 0 END) / 
          COUNT(s.seat_id) * 100, 2) as occupancy_percentage
FROM Buses b
LEFT JOIN Seats s ON b.bus_id = s.bus_id
GROUP BY b.bus_id, b.bus_number, b.bus_type
ORDER BY occupancy_percentage DESC;
```

**Sample Output:**
```
bus_number | bus_type | total_seats | booked_seats | available_seats | occupancy_percentage
BUS-001    | AC       | 45          | 8           | 37             | 17.78%
BUS-002    | Sleeper  | 30          | 2           | 28             | 6.67%
BUS-003    | Non-AC   | 50          | 1           | 49             | 2.00%
BUS-004    | AC       | 40          | 2           | 38             | 5.00%
```

### Query 3: Conductor Performance
```sql
SELECT 
    c.conductor_name,
    COUNT(DISTINCT t.ticket_id) as tickets_issued,
    SUM(p.payment_amount) as total_collection,
    COUNT(CASE WHEN p.payment_method='Cash' THEN 1 END) as cash_payments,
    COUNT(CASE WHEN p.payment_method='UPI' THEN 1 END) as upi_payments,
    COUNT(CASE WHEN p.payment_method='Online' THEN 1 END) as online_payments
FROM Conductors c
LEFT JOIN Tickets t ON c.conductor_id = t.conductor_id
LEFT JOIN Payments p ON t.ticket_id = p.ticket_id 
                        AND p.payment_status = 'Success'
GROUP BY c.conductor_id, c.conductor_name
ORDER BY total_collection DESC;
```

**Sample Output:**
```
conductor_name | tickets_issued | total_collection | cash_payments | upi_payments | online_payments
Rajesh Kumar   | 3             | 1500.00         | 1            | 1           | 1
Priya Singh    | 2             | 1400.00         | 1            | 1           | 0
Arun Patel     | 1             | 1200.00         | 0            | 0           | 1
Meera Desai    | 2             | 1100.00         | 1            | 0           | 1
```

### Query 4: Route Revenue Analysis
```sql
SELECT 
    r.route_name,
    r.source_city,
    r.destination_city,
    COUNT(DISTINCT t.ticket_id) as total_bookings,
    SUM(p.payment_amount) as route_revenue,
    AVG(p.payment_amount) as avg_fare,
    COUNT(DISTINCT t.passenger_id) as unique_passengers
FROM Routes r
JOIN Bus_Routes br ON r.route_id = br.route_id
LEFT JOIN Tickets t ON br.bus_route_id = t.bus_route_id
LEFT JOIN Payments p ON t.ticket_id = p.ticket_id 
                        AND p.payment_status = 'Success'
GROUP BY r.route_id, r.route_name, r.source_city, r.destination_city
ORDER BY route_revenue DESC;
```

**Sample Output:**
```
route_name           | source_city | destination_city | total_bookings | route_revenue | avg_fare | unique_passengers
Mumbai-Pune Express  | Mumbai      | Pune            | 3             | 1500.00      | 500.00  | 3
Delhi-Agra Express   | Delhi       | Agra            | 2             | 1400.00      | 700.00  | 2
Bangalore-Hyderabad  | Bangalore   | Hyderabad       | 1             | 1200.00      | 1200.00 | 1
Chennai-Coimbatore   | Chennai     | Coimbatore      | 2             | 1100.00      | 550.00  | 2
```

---

## 🔍 VERIFICATION QUERIES

### Check if Double Booking Occurred
```sql
SELECT 
    s.seat_number,
    b.bus_number,
    r.route_name,
    COUNT(t.ticket_id) as booking_count,
    GROUP_CONCAT(p.passenger_name) as passengers
FROM Tickets t
JOIN Seats s ON t.seat_id = s.seat_id
JOIN Buses b ON s.bus_id = b.bus_id
JOIN Bus_Routes br ON t.bus_route_id = br.bus_route_id
JOIN Routes r ON br.route_id = r.route_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
WHERE t.journey_status != 'Cancelled'
GROUP BY s.seat_id, s.seat_number, b.bus_number
HAVING COUNT(t.ticket_id) > 1;

-- Expected Result: EMPTY (No double bookings)
```

### Check Payment Discrepancies
```sql
SELECT 
    t.ticket_id,
    t.ticket_number,
    t.ticket_price,
    p.payment_amount,
    p.payment_status
FROM Tickets t
JOIN Payments p ON t.ticket_id = p.ticket_id
WHERE t.ticket_price != p.payment_amount;

-- Expected Result: EMPTY (All amounts match)
```

### Validate QR Code Consistency
```sql
SELECT 
    t.ticket_id,
    t.qr_code_id,
    qr.qr_code_id,
    COUNT(*) as count
FROM Tickets t
LEFT JOIN QR_Codes qr ON t.ticket_id = qr.ticket_id
GROUP BY t.ticket_id
HAVING COUNT(*) != 1;

-- Expected Result: EMPTY (Each ticket has exactly one QR)
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Indexes Already Created:
```sql
-- Speeds up seat availability queries
CREATE INDEX idx_seats_bus_status ON Seats(bus_id, status);

-- Speeds up passenger history queries
CREATE INDEX idx_tickets_passenger ON Tickets(passenger_id);

-- Speeds up date-based reports
CREATE INDEX idx_tickets_boarding_date ON Tickets(boarding_date);

-- Speeds up payment status checks
CREATE INDEX idx_payments_status ON Payments(payment_status);

-- Speeds up QR validity checks
CREATE INDEX idx_qr_codes_validity ON QR_Codes(qr_validity_status);

-- Speeds up route scheduling queries
CREATE INDEX idx_routes_date ON Routes(travel_date);
```

### Query Performance Tips:
```
1. Always filter by date when querying historical data
2. Use prepared statements to prevent SQL injection
3. Limit result sets with LIMIT clause
4. Use EXPLAIN to analyze query performance
5. Archive old data periodically
```

---

## 🛠️ MAINTENANCE TASKS

### Daily
```sql
-- 1. Generate revenue report
SELECT * FROM RevenueSummaryView;

-- 2. Check pending payments
SELECT * FROM Payments WHERE payment_status = 'Pending';

-- 3. Monitor QR scan rates
SELECT COUNT(*) as total_scans 
FROM QR_Codes 
WHERE DATE(last_scanned_at) = CURDATE();
```

### Weekly
```sql
-- 1. Backup database
-- 2. Archive old tickets (older than 30 days)
-- 3. Verify data consistency
SELECT COUNT(*) FROM Seats WHERE bus_id NOT IN (SELECT bus_id FROM Buses);

-- 4. Check for cancelled bookings
SELECT COUNT(*) FROM Tickets WHERE journey_status = 'Cancelled';
```

### Monthly
```sql
-- 1. Generate performance report
-- 2. Update analytics
-- 3. Identify problem routes (low occupancy)
SELECT * FROM ActiveRoutesView 
WHERE availability_percentage > 50;

-- 4. Check conductor performance
SELECT * FROM Conductors WHERE status = 'Active';
```

---

## 🎯 COMMON ERRORS & SOLUTIONS

| Error | Cause | Solution |
|-------|-------|----------|
| Duplicate entry for key | Trying to book same seat twice | Check seat status before booking |
| Foreign key constraint fails | Deleting parent record | Use CASCADE DELETE |
| Payment not recorded | Transaction incomplete | Use stored procedure with BEGIN/COMMIT |
| QR already used | Scanning same ticket twice | Check scan_count in QR_Codes table |
| Seat not available | Concurrent bookings | Use SELECT...FOR UPDATE lock |

---

## 📝 SQL SCRIPT EXECUTION CHECKLIST

- [ ] Database created: `BusTicketSystem`
- [ ] 9 Tables created with all columns
- [ ] Primary keys set on all tables
- [ ] Foreign keys created with CASCADE
- [ ] CHECK constraints applied
- [ ] UNIQUE constraints applied
- [ ] Sample data inserted (4 conductors, 4 buses, 4 routes)
- [ ] Seats created for all buses (70 total)
- [ ] Passengers inserted (8 records)
- [ ] Tickets created (8 bookings)
- [ ] Payments recorded (8 transactions)
- [ ] QR codes generated (8 records)
- [ ] Triggers created (3 triggers)
- [ ] Stored procedures created (3 procedures)
- [ ] Views created (3 views)
- [ ] Indexes created (6 indexes)
- [ ] Sample queries executed successfully
- [ ] No errors in error log

---

**Version:** 1.0  
**Last Updated:** 2026-04-22  
**Status:** Production Ready
