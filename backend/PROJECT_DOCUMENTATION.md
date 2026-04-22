# Smart Bus Ticket Booking System with Payment and QR Scanner
## Complete SQL Mini Project Documentation

---

## 📋 PROJECT OVERVIEW

**Project Title:** Smart Bus Ticket Booking System with Payment and QR Scanner  
**Type:** Conductor-based ticket system (No user login required)  
**Database:** Relational SQL Database  
**Complexity Level:** Intermediate (Suitable for college mini-project viva)

---

## 🎯 CORE OBJECTIVES

1. Build a conductor-operated ticket booking system
2. Manage bus seats, routes, and availability
3. Process multiple payment methods with transaction tracking
4. Generate and verify unique QR codes for each ticket
5. Maintain payment records and revenue analytics
6. Prevent double booking using database constraints

---

## 📊 DATABASE SCHEMA DESIGN

### 1. **CONDUCTORS TABLE**
```sql
Purpose: Store conductor/staff information
Columns:
  - conductor_id (PK, Auto-increment)
  - conductor_name (Name of conductor)
  - employee_id (Unique ID)
  - contact_number (Phone number)
  - email (Email address)
  - joining_date (Employment date)
  - status (Active/Inactive)

Use Case: Track who issued tickets and received payments
```

### 2. **BUSES TABLE**
```sql
Purpose: Store bus information and real-time availability
Columns:
  - bus_id (PK)
  - bus_number (Unique registration number)
  - bus_type (AC/Non-AC/Sleeper)
  - total_seats (Static capacity)
  - available_seats (Dynamic - updates after booking)
  - conductor_id (FK - which conductor operates)

Key Feature: available_seats is automatically updated via triggers
```

### 3. **ROUTES TABLE**
```sql
Purpose: Store journey route information
Columns:
  - route_id (PK)
  - route_name (E.g., "Mumbai-Pune Express")
  - source_city, destination_city
  - distance_km (Journey distance)
  - base_fare (Pricing)
  - travel_date, departure_time, arrival_time
  - status (Scheduled/Cancelled/Completed)

Use Case: Different buses can operate same routes on different dates
```

### 4. **BUS_ROUTES TABLE** (Junction/Bridge Table)
```sql
Purpose: Link buses with routes (Many-to-Many relationship)
Columns:
  - bus_route_id (PK)
  - bus_id (FK to Buses)
  - route_id (FK to Routes)
  - available_capacity (Current availability for this bus-route)
  - total_capacity (Total seats for this combination)

Why Needed: 
  - Bus A can run Route 1 on Mon, Tue, Wed
  - Bus B can also run Route 1 on Wed
  - Flexible scheduling without data redundancy
```

### 5. **SEATS TABLE**
```sql
Purpose: Track individual seat status
Columns:
  - seat_id (PK)
  - bus_id (FK - which bus)
  - seat_number (E.g., "A1", "B2")
  - seat_type (Window/Aisle/Middle)
  - status (Available/Booked/Reserved)

Important:
  - Enables seat-level control
  - Prevents double-booking at database level
  - UNIQUE constraint: (bus_id, seat_number)
```

### 6. **PASSENGERS TABLE**
```sql
Purpose: Store passenger information
Columns:
  - passenger_id (PK)
  - passenger_name
  - contact_number
  - age, gender
  - id_type, id_number (Aadhar/PAN/Passport/DL/Voter ID)

Use Case: Keep passenger master data separate from transactions
```

### 7. **TICKETS TABLE** (Core Transaction Table)
```sql
Purpose: Main transaction table - ticket issuance
Columns:
  - ticket_id (PK)
  - ticket_number (Unique: TKT-YYYYMMDD-SEQ)
  - qr_code_id (Unique: QR-YYYY-MM-DD-SEQ) ← QR Code ID
  - passenger_id (FK)
  - bus_route_id (FK)
  - seat_id (FK)
  - conductor_id (FK - who issued)
  - booking_date, boarding_date
  - journey_status (Booked/Checked-In/Completed/Cancelled)
  - ticket_price
  - qr_scan_status (Not Scanned/Scanned/Invalid)
  - qr_scanned_at (Timestamp of QR scan)

Key Features:
  - Links passengers, bus_routes, seats, conductors
  - Tracks QR scanning
  - Records boarding journey progress
```

### 8. **PAYMENTS TABLE**
```sql
Purpose: Financial transaction tracking
Columns:
  - payment_id (PK)
  - ticket_id (FK, UNIQUE)
  - payment_amount
  - payment_method (Cash/UPI/Online)
  - payment_status (Success/Pending/Failed/Refunded)
  - transaction_id (Unique transaction reference)
  - upi_id (For UPI payments)
  - bank_name (For online payments)
  - payment_date, payment_time
  - payment_received_by (Conductor ID)

Business Logic:
  - Ticket can only be booked if payment_status = 'Success'
  - Stores transaction IDs for reconciliation
  - Tracks payment method for analytics
```

### 9. **QR_CODES TABLE** (QR Verification Tracking)
```sql
Purpose: QR code management and audit trail
Columns:
  - qr_id (PK)
  - ticket_id (FK)
  - qr_code_id (Unique)
  - qr_data (Encoded JSON with ticket details)
  - qr_generated_at (When QR was created)
  - qr_validity_status (Valid/Invalid/Expired/Used)
  - scan_count (How many times scanned)
  - last_scanned_at (Timestamp)
  - last_scanned_by (Conductor who scanned)

Security Features:
  - One-time use: Status changes to 'Used' after first scan
  - Prevents duplicate boarding
  - Maintains complete audit trail
```

---

## 🔐 DATA CONSTRAINTS & INTEGRITY

### Primary Keys
- All tables have `id` columns as PRIMARY KEY with AUTO_INCREMENT
- Ensures uniqueness and fast lookups

### Foreign Keys
- ticket_id → Conductors, Passengers, Buses, Routes
- Maintains referential integrity
- CASCADE DELETE ensures orphaned records don't exist

### Unique Constraints
- bus_number (UNIQUE) - No two buses have same number
- ticket_number (UNIQUE) - Each ticket has unique identifier
- qr_code_id (UNIQUE) - Each QR code is unique
- (bus_id, seat_number) UNIQUE - No duplicate seats in a bus
- (bus_id, route_id) UNIQUE - Each bus-route combination is unique

### Check Constraints
- total_seats > 0 - Bus must have at least 1 seat
- ticket_price > 0 - Ticket price must be positive
- age between 0 and 120 - Valid age range

---

## 🎫 TICKET BOOKING WORKFLOW

### Step 1: Conductor Selects Route
```sql
-- View available routes
SELECT * FROM Routes WHERE status = 'Scheduled'
```

### Step 2: Display Available Seats
```sql
-- Show available seats for selected route
SELECT s.* FROM Seats s
WHERE s.bus_id IN (
  SELECT bus_id FROM Bus_Routes WHERE route_id = ?
) AND s.status = 'Available'
```

### Step 3: Passenger Details Entry
- Conductor enters: Name, Contact, Age, Gender
- Captures: ID type and ID number

### Step 4: Seat Selection
- Conductor selects seat from available list
- Database checks: Seat status must be 'Available'

### Step 5: Payment Processing
- Conductor selects payment method: Cash/UPI/Online
- For Online/UPI: Enter transaction ID
- Payment status: Success/Failed/Pending

### Step 6: Automatic Updates
**Triggers fire automatically:**
- Seat status changes to 'Booked'
- available_seats decreases in Buses table
- available_capacity decreases in Bus_Routes table
- Unique ticket number generated
- Unique QR code ID generated

### Step 7: QR Code Display
- Show QR code to passenger
- Store in QR_Codes table with validation status

---

## 💳 PAYMENT SYSTEM

### Payment Methods Supported
1. **Cash**
   - Immediate payment at ticket counter
   - Payment status: Success
   - No additional fields needed

2. **UPI**
   - Requires UPI ID field
   - Transaction ID recorded
   - Payment status: Success/Pending based on gateway

3. **Online**
   - Requires Bank Name field
   - Transaction ID from bank
   - Payment status: Success/Failed

### Payment Flow
```
Ticket Creation → Capture Payment Details → Verify Status → 
Issue Ticket with QR Code → Generate Receipt
```

### Query: Check Payment Status
```sql
SELECT * FROM Payments 
WHERE payment_status = 'Success' 
  AND ticket_id = ?
```

---

## 📱 QR CODE SYSTEM

### QR Generation
```
QR Code ID Format: QR-YYYY-MM-DD-SEQUENCE
Example: QR-2026-04-25-001

Encoded Data (JSON):
{
  "ticket_id": "TKT-001",
  "passenger_name": "Amit Sharma",
  "bus_number": "BUS-001",
  "seat_number": "A1",
  "route": "Mumbai-Pune",
  "travel_date": "2026-04-25"
}
```

### QR Scanning Process

**Before Scan:**
- qr_validity_status = 'Valid'
- scan_count = 0
- last_scanned_at = NULL

**Scanning Steps:**
1. Conductor scans QR code at boarding
2. System reads qr_code_id
3. Query QR_Codes table: Verify qr_validity_status = 'Valid'
4. Verify Tickets: journey_status = 'Booked'
5. Verify Payments: payment_status = 'Success'
6. Check boarding_date matches current date

**After Successful Scan:**
- qr_validity_status = 'Used'
- scan_count increments by 1
- last_scanned_at = current timestamp
- last_scanned_by = conductor_id
- Ticket journey_status = 'Checked-In'
- Display: "✓ Passenger boarded successfully"

**Error Scenarios:**
- "Invalid QR Code" - Not found in database
- "Already Used" - scan_count > 0
- "Ticket Cancelled" - journey_status = 'Cancelled'
- "Payment Pending" - payment_status != 'Success'

---

## 🛡️ DOUBLE BOOKING PREVENTION

### Method 1: Database Constraints
```sql
-- Unique constraint prevents same seat in same bus
UNIQUE KEY unique_seat_per_bus (bus_id, seat_number)
```

### Method 2: Status Checking
```sql
-- Before booking, check if seat is available
WHERE seat_id = ? AND status = 'Available'
```

### Method 3: Transaction Safety
```sql
-- Lock seat while processing (in stored procedure)
SELECT * FROM Seats WHERE seat_id = ? FOR UPDATE
```

### Method 4: Automatic Updates
- Trigger immediately changes status to 'Booked'
- No window for concurrent bookings

---

## 📊 ADVANCED QUERIES & REPORTS

### 1. Revenue Per Route
```sql
SELECT r.route_name, 
       COUNT(t.ticket_id) AS tickets,
       SUM(pay.payment_amount) AS revenue
FROM Routes r
JOIN Bus_Routes br ON r.route_id = br.route_id
LEFT JOIN Tickets t ON br.bus_route_id = t.bus_route_id
LEFT JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY r.route_id
ORDER BY revenue DESC
```

### 2. Bus Occupancy Analysis
```sql
SELECT b.bus_number,
       b.total_seats,
       COUNT(CASE WHEN s.status = 'Booked' THEN 1 END) AS booked,
       COUNT(CASE WHEN s.status = 'Available' THEN 1 END) AS available,
       ROUND((booked/b.total_seats)*100, 2) AS occupancy_pct
FROM Buses b
LEFT JOIN Seats s ON b.bus_id = s.bus_id
GROUP BY b.bus_id
ORDER BY occupancy_pct DESC
```

### 3. Conductor Performance
```sql
SELECT c.conductor_name,
       COUNT(DISTINCT t.ticket_id) AS tickets_issued,
       SUM(pay.payment_amount) AS collection,
       COUNT(CASE WHEN pay.payment_method='Cash' THEN 1 END) AS cash,
       COUNT(CASE WHEN pay.payment_method='UPI' THEN 1 END) AS upi,
       COUNT(CASE WHEN pay.payment_method='Online' THEN 1 END) AS online
FROM Conductors c
LEFT JOIN Tickets t ON c.conductor_id = t.conductor_id
LEFT JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY c.conductor_id
ORDER BY collection DESC
```

### 4. Payment Method Analytics
```sql
SELECT pay.payment_method,
       COUNT(*) AS count,
       SUM(pay.payment_amount) AS amount,
       AVG(pay.payment_amount) AS avg_price
FROM Payments pay
WHERE pay.payment_status = 'Success'
GROUP BY pay.payment_method
ORDER BY amount DESC
```

### 5. QR Scan Report
```sql
SELECT t.ticket_number,
       p.passenger_name,
       qr.qr_code_id,
       qr.scan_count,
       qr.last_scanned_at,
       c.conductor_name
FROM QR_Codes qr
JOIN Tickets t ON qr.ticket_id = t.ticket_id
JOIN Passengers p ON t.passenger_id = p.passenger_id
LEFT JOIN Conductors c ON qr.last_scanned_by = c.conductor_id
WHERE qr.scan_count > 0
ORDER BY qr.last_scanned_at DESC
```

---

## ⚙️ TRIGGERS (Automatic Operations)

### Trigger 1: Auto-Update Seat Status
```sql
AFTER INSERT ON Tickets
→ UPDATE Seats SET status = 'Booked'
```

### Trigger 2: Update Bus Availability
```sql
AFTER UPDATE ON Seats (when status = 'Booked')
→ UPDATE Buses SET available_seats = available_seats - 1
```

### Trigger 3: Update Route Capacity
```sql
AFTER UPDATE ON Buses (when available_seats changes)
→ UPDATE Bus_Routes SET available_capacity = new_value
```

**Benefit:** No manual updates needed - consistency maintained automatically!

---

## 🔧 STORED PROCEDURES

### 1. BookTicket Procedure
```sql
CALL BookTicket(
  'John Doe',           -- passenger_name
  '9876543214',        -- contact
  30,                  -- age
  'Male',              -- gender
  'Aadhar',            -- id_type
  '523456789012',      -- id_number
  1,                   -- bus_route_id
  5,                   -- seat_id
  1,                   -- conductor_id
  'Cash',              -- payment_method
  'TXN-2026-04-23-006', -- transaction_id
  500.00               -- ticket_price
);

Result: Returns ticket_id, ticket_number, qr_code_id
```

### 2. ScanQRCode Procedure
```sql
CALL ScanQRCode(
  'QR-2026-04-25-001',  -- qr_code_id to scan
  1                      -- conductor_id who scanned
);

Result: 'QR Scanned Successfully' with passenger name
        or 'Invalid QR Code' if not valid
```

### 3. GetAvailableSeats Procedure
```sql
CALL GetAvailableSeats(1);  -- route_id

Result: List of all available seats with bus and route details
```

---

## 📈 VIEWS (Pre-built Queries)

### View 1: ActiveRoutesView
Shows all scheduled routes with current availability percentages

### View 2: TicketStatusView
Shows all tickets with complete journey and payment status

### View 3: RevenueSummaryView
Daily revenue breakdown by route and payment method

---

## 🎓 WHY THIS DESIGN IS GOOD FOR VIVA

### ✅ Normalization (3NF)
- No data redundancy
- Proper separation of concerns
- Each table has single responsibility

### ✅ Data Integrity
- Primary keys ensure uniqueness
- Foreign keys maintain relationships
- Constraints prevent invalid data

### ✅ Real-world Scenario
- Reflects actual bus ticketing system
- Handles payment processing
- Implements QR verification

### ✅ Advanced Features
- Triggers for automation
- Stored procedures for complex operations
- Views for reporting
- Transactions for consistency

### ✅ Security & Fraud Prevention
- One-time QR scanning
- Payment verification
- Double-booking prevention
- Audit trail for all transactions

### ✅ Scalability
- Indexing for performance
- Efficient queries
- Can handle thousands of buses/routes

---

## 📝 SAMPLE OUTPUT

### Booking a Ticket
```
Input:
  Passenger: Amit Sharma
  Bus: BUS-001 (Mumbai-Pune)
  Seat: A1 (Window)
  Payment: Cash - Success

Output:
  ✓ Ticket Number: TKT-2026042501
  ✓ QR Code: QR-2026-04-25-001
  ✓ Amount: Rs. 500
  ✓ Status: Booked
```

### Scanning QR at Boarding
```
Input:
  Scanned QR: QR-2026-04-25-001
  Conductor: Rajesh Kumar

Output:
  ✓ Passenger: Amit Sharma
  ✓ Seat: A1
  ✓ Status: Checked-In
  ✓ Journey: Valid
```

### Revenue Report
```
Route                   Tickets   Revenue
Mumbai-Pune Express     45        ₹22,500
Delhi-Agra Express      28        ₹19,600
Chennai-Coimbatore      32        ₹17,600
Bangalore-Hyderabad     15        ₹18,000
```

---

## 🚀 HOW TO IMPLEMENT

### Step 1: Database Setup
```sql
-- Copy entire bus_ticket_system.sql
-- Run in MySQL/PostgreSQL/SQL Server
-- All tables, data, triggers will be created
```

### Step 2: Backend Integration
```
- Connect to database using Python/Node.js/Java
- Implement REST APIs for:
  • GET /routes (List available routes)
  • POST /tickets (Book ticket)
  • POST /scan-qr (Verify QR code)
  • GET /analytics (Revenue reports)
```

### Step 3: Frontend (Conductor Interface)
```
- Simple web/mobile app
- Dropdown for route selection
- Seat availability display
- Payment method selection
- QR code display and print
- QR code scanner input
```

---

## 📋 CHECKLIST FOR VIVA

- [x] Database design with proper normalization
- [x] All 9 essential tables created
- [x] Primary & Foreign keys implemented
- [x] Data constraints for data quality
- [x] Sample data inserted (8 buses, 4 routes, 8 passengers, 8 tickets)
- [x] SELECT queries for reporting (12 queries)
- [x] JOIN queries across multiple tables
- [x] GROUP BY for aggregations
- [x] UPDATE queries for seat availability
- [x] Payment system with multiple methods
- [x] QR code generation and verification
- [x] Triggers for automatic updates
- [x] Stored procedures for operations
- [x] Views for common reports
- [x] Fraud prevention (double booking)
- [x] Indexes for performance
- [x] Complete documentation
- [x] Sample outputs and explanations

---

## 🎯 Key Features to Highlight in Viva

1. **Conductor-based System** - No complex user authentication
2. **Real-time Seat Management** - Automatic updates via triggers
3. **Payment Integration** - Multiple payment methods with transaction IDs
4. **QR Security** - One-time use, scan tracking, audit trail
5. **Revenue Analytics** - Group by route, payment method, conductor
6. **Fraud Prevention** - Unique constraints, payment verification
7. **Normalization** - Properly normalized 3NF design
8. **Scalability** - Can handle thousands of buses and transactions

---

## 💡 BONUS IMPROVEMENTS (If Needed)

1. Add SMS/Email notifications on ticket booking
2. Implement cancellation with refund logic
3. Add bulk booking for groups
4. Weekend premium pricing
5. Loyalty points system
6. Dynamic pricing based on occupancy
7. Seat preferences (Window/Aisle selection)
8. Passenger feedback/reviews table

---

## ❓ COMMON VIVA QUESTIONS & ANSWERS

**Q: Why separate Passengers and Tickets tables?**
A: To maintain master data of all passengers separately, allowing multiple bookings per passenger.

**Q: How do you prevent double booking?**
A: Using UNIQUE constraint on (bus_id, seat_number) and status checking before booking.

**Q: Why do you need Bus_Routes table?**
A: To create Many-to-Many relationship - same bus can run different routes, same route can have different buses.

**Q: How is QR code security maintained?**
A: Status changes to 'Used' after first scan, preventing duplicate usage. Audit trail records all scans.

**Q: What's the purpose of Triggers?**
A: Automatic data consistency - when ticket is created, seat status and availability automatically update.

---

## 📞 SUPPORT FOR VIVA PREPARATION

Study Points:
- Entity-Relationship Diagram (ERD) of all tables
- Normalization concepts (1NF, 2NF, 3NF)
- JOIN operations between tables
- Transaction safety and ACID properties
- Trigger functionality and benefits
- Stored procedure parameters and execution
- Index creation for optimization

---

**Project Created:** 2026-04-22  
**Version:** 1.0  
**Status:** Complete & Ready for Submission

---
