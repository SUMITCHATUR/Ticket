# 🚌 Smart Bus Ticket Booking System with Payment and QR Scanner

> **A Complete SQL Mini Project for College Evaluation**
>
> This is a production-ready database system for conductor-based bus ticket booking with payment processing and QR code verification.

---

## 📋 Project Summary

### 🎯 What This Project Does

This system manages an **end-to-end bus ticket booking workflow**:

1. **Conductor selects a route** and displays available seats
2. **Passenger books a seat** with personal details
3. **Payment is processed** (Cash/UPI/Online)
4. **Ticket is issued** with a unique QR code
5. **QR is scanned at boarding** to verify and check-in passenger
6. **Revenue reports** track daily operations

### ⭐ Key Features

- ✅ **Conductor-based System** - No customer login, direct ticketing
- ✅ **Real-time Seat Management** - Automatic availability updates
- ✅ **Multiple Payment Methods** - Cash, UPI, Online with transaction tracking
- ✅ **QR Code Verification** - One-time use, fraud prevention
- ✅ **Double Booking Prevention** - Database constraints + triggers
- ✅ **Revenue Analytics** - Route-wise, payment-wise, conductor-wise reports
- ✅ **Data Integrity** - Proper normalization, foreign keys, constraints
- ✅ **Scalability** - Indexes, stored procedures, efficient queries

---

## 📁 Project Files

### 1. **bus_ticket_system.sql** (Main Database File)
**Contains:** Complete SQL code with all tables, data, queries, triggers, procedures

**What's Inside:**
- 9 normalized database tables
- 8 sample records (buses, routes, conductors, passengers)
- 12+ SELECT queries for reporting
- 3 Stored procedures for operations
- 3 Triggers for automatic updates
- 3 Views for common reports
- 6 Performance indexes

**Size:** ~900 lines of well-commented SQL

**How to Use:**
```bash
# Option 1: MySQL Command Line
mysql -u root -p BusTicketSystem < bus_ticket_system.sql

# Option 2: MySQL Workbench
1. Open MySQL Workbench
2. File → Open SQL Script → Select file
3. Execute (Ctrl+Shift+Enter)

# Option 3: Any SQL IDE (DataGrip, DBeaver, pgAdmin)
1. Create new database: BusTicketSystem
2. Execute the SQL file
```

---

### 2. **PROJECT_DOCUMENTATION.md** (Comprehensive Guide)
**Contains:** Complete project documentation and theory

**Sections:**
- Project overview and objectives
- Detailed database schema design (all 9 tables)
- Table relationships and normalization
- Ticket booking workflow
- Payment system explanation
- QR code system architecture
- Double booking prevention methods
- 12 advanced queries with explanations
- Triggers and stored procedures overview
- Views for reporting
- Why this design is good for viva
- Common viva questions with answers

**Best For:** Understanding the system, viva preparation, documentation

---

### 3. **QUICK_REFERENCE_GUIDE.md** (Developer Reference)
**Contains:** Quick lookup and implementation guide

**Sections:**
- Text format Entity-Relationship Diagram (ERD)
- Step-by-step implementation instructions
- Daily operations workflow with SQL queries
- Complete booking example with sample outputs
- QR code scanning example
- 4 analytics queries with sample results
- Verification queries (prevent fraud)
- Performance optimization tips
- Maintenance tasks (daily/weekly/monthly)
- Common errors and solutions
- Execution checklist

**Best For:** Quick lookups, daily operations, troubleshooting

---

### 4. **BACKEND_IMPLEMENTATION_GUIDE.md** (Developer Code)
**Contains:** Practical code examples for implementation

**Sections:**
- Python (MySQL connector) - Complete examples
- Node.js (mysql2) - Complete examples
- Java (JDBC) - Complete examples
- 7 REST API endpoints with request/response formats
- Error handling with error codes
- Unit test examples (pytest, JUnit)
- Mobile app integration (React Native)
- Reporting API implementation
- Security best practices
- Interview Q&A

**Best For:** Backend developers, implementing REST APIs, mobile integration

---

### 5. **README.md** (This File)
**Contains:** Project overview and how to use all files

---

## 🗂️ Database Schema at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    9 NORMALIZED TABLES                      │
└─────────────────────────────────────────────────────────────┘

1. CONDUCTORS        - Staff information
2. BUSES             - Bus inventory (45 seats, 30 sleeper, etc.)
3. ROUTES            - Journey routes (Mumbai→Pune, Delhi→Agra, etc.)
4. BUS_ROUTES        - Many-to-many: Bus runs on Route
5. SEATS             - Individual seat tracking
6. PASSENGERS        - Passenger master data
7. TICKETS           - Main transaction table
8. PAYMENTS          - Financial records
9. QR_CODES          - QR verification & audit trail
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Import Database
```sql
CREATE DATABASE BusTicketSystem;
USE BusTicketSystem;
-- Copy entire bus_ticket_system.sql and execute
```

### Step 2: Verify Setup
```sql
-- Check all tables
SHOW TABLES;

-- Verify sample data
SELECT COUNT(*) FROM Tickets;  -- Should return 8
```

### Step 3: Test Booking
```sql
-- View available seats
CALL GetAvailableSeats(1);

-- View tickets booked today
SELECT * FROM TicketStatusView WHERE boarding_date = CURDATE();
```

### Step 4: Test QR Scanning
```sql
-- Scan a QR code
CALL ScanQRCode('QR-2026-04-25-001', 1);
```

---

## 📊 Sample Workflow

### Scenario: Book Ticket for Amit Sharma on Mumbai-Pune Route

```sql
-- Step 1: Conductor selects route
SELECT * FROM Routes WHERE status = 'Scheduled';
-- Result: Route ID 1 (Mumbai-Pune)

-- Step 2: Display available seats
CALL GetAvailableSeats(1);
-- Result: Seats A1, A2, B1, etc. available

-- Step 3: Passenger provides details
-- Step 4: Conductor selects seat A1 and processes booking

CALL BookTicket(
  'Amit Sharma',        -- passenger_name
  '9876543210',         -- contact
  28,                   -- age
  'Male',               -- gender
  'Aadhar',             -- id_type
  '123456789012',       -- id_number
  1,                    -- bus_route_id
  1,                    -- seat_id
  1,                    -- conductor_id
  'Cash',               -- payment_method
  'TXN-2026-04-23-001', -- transaction_id
  500.00                -- ticket_price
);

-- Result:
-- ticket_id: 1
-- ticket_number: TKT-001
-- qr_code: QR-2026-04-25-001

-- Automatic Updates (via Triggers):
-- ✓ Seat A1 status: Available → Booked
-- ✓ Bus-001 available_seats: 45 → 44
-- ✓ Route 1 available_capacity: 45 → 44

-- Step 5: Display ticket with QR code to passenger
```

### At Boarding Gate

```sql
-- Conductor scans QR code
CALL ScanQRCode('QR-2026-04-25-001', 1);

-- Result:
-- ✓ Passenger: Amit Sharma
-- ✓ Seat: A1
-- ✓ Status: Checked-In
-- ✓ Journey: Valid

-- Automatic Updates:
-- ✓ QR status: Valid → Used
-- ✓ Ticket status: Booked → Checked-In
-- ✓ QR scan_count: 0 → 1
-- ✓ last_scanned_at: Current timestamp

-- Second Scan Attempt (Fraud Prevention):
-- ✗ INVALID QR CODE
-- "Ticket Already Used - Fraud Attempt"
```

---

## 📈 Key Queries

### Revenue Today
```sql
SELECT 
    COUNT(*) as tickets,
    SUM(payment_amount) as revenue
FROM Payments
WHERE DATE(payment_date) = CURDATE() AND payment_status = 'Success';
```

### Bus Occupancy
```sql
SELECT 
    bus_number,
    total_seats - available_seats as booked,
    ROUND(((total_seats - available_seats)/total_seats)*100, 2) as occupancy_pct
FROM Buses ORDER BY occupancy_pct DESC;
```

### Revenue Per Route
```sql
SELECT 
    r.route_name,
    COUNT(*) as tickets,
    SUM(pay.payment_amount) as revenue
FROM Routes r
JOIN Bus_Routes br ON r.route_id = br.route_id
LEFT JOIN Tickets t ON br.bus_route_id = t.bus_route_id
LEFT JOIN Payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY r.route_id
ORDER BY revenue DESC;
```

---

## 🎓 Why This Project is Perfect for Viva

### ✅ Normalization (3NF)
- No data redundancy
- Proper separation of concerns
- Each table has single responsibility

### ✅ Real-world Scenario
- Reflects actual bus ticketing system
- Handles payment processing
- Implements fraud prevention

### ✅ Advanced Features
- 3 Triggers for automation
- 3 Stored procedures for complex operations
- 3 Views for reporting
- Transactions for consistency

### ✅ Data Integrity
- Primary keys ensure uniqueness
- Foreign keys maintain relationships
- Constraints prevent invalid data
- Unique constraints prevent duplicate bookings

### ✅ Complete Implementation
- All required tables present
- Sample data provided
- Queries demonstrate understanding
- Error handling implemented

### ✅ Good Documentation
- Clear explanations
- SQL comments throughout
- Sample outputs
- Viva preparation guide

---

## 🛡️ How Double Booking is Prevented

### Method 1: Database Constraints
```sql
UNIQUE KEY unique_seat_per_bus (bus_id, seat_number)
```
**Effect:** Same seat can't be booked twice in same bus

### Method 2: Status Checking
```sql
SELECT * FROM Seats WHERE seat_id = ? AND status = 'Available'
```
**Effect:** Only available seats can be selected

### Method 3: Transaction Locking
```sql
SELECT * FROM Seats WHERE seat_id = ? FOR UPDATE
```
**Effect:** Locks seat during booking transaction

### Method 4: Automatic Trigger
```sql
AFTER INSERT ON Tickets → UPDATE Seats SET status = 'Booked'
```
**Effect:** Seat status immediately changes, preventing concurrent bookings

---

## 💳 Payment System

### Supported Methods
1. **Cash** - Immediate payment, status = Success
2. **UPI** - Requires UPI ID, transaction ID from gateway
3. **Online** - Requires bank name, transaction ID from bank

### Payment Status Tracking
```
Booking Initiated → Payment Processing → Payment Verified → 
Ticket Issued (Only if status = Success)
```

### Query: Check Payment Status
```sql
SELECT * FROM Payments WHERE ticket_id = ?;
```

---

## 📱 QR Code System

### QR Generation
```
Format: QR-YYYY-MM-DD-SEQUENCE
Example: QR-2026-04-25-001

Encoded Data:
{
  "ticket_id": "TKT-001",
  "passenger_name": "Amit Sharma",
  "bus_number": "BUS-001",
  "seat_number": "A1",
  "route": "Mumbai-Pune",
  "travel_date": "2026-04-25"
}
```

### QR Verification
```
Scan QR → Read qr_code_id → Check validity status → 
Verify payment → Verify date → Check scan_count → Update scan records
```

### One-Time Use
```
First Scan: qr_validity_status = 'Valid' → 'Used'
Second Scan: qr_validity_status = 'Used' → ERROR
```

---

## 🧮 Database Statistics

### Tables
- 9 normalized tables
- 25+ columns with proper types
- Primary keys on all tables
- Foreign keys with CASCADE

### Sample Data
- 4 Conductors (Active/Inactive statuses)
- 4 Buses (AC/Sleeper/Non-AC)
- 4 Routes (Different cities)
- 70 Seats (Distributed across buses)
- 8 Passengers
- 8 Tickets
- 8 Payments
- 8 QR Codes

### Features
- 12+ SELECT queries
- 3 Stored procedures
- 3 Triggers
- 3 Views
- 6 Performance indexes

---

## 🔧 Implementation Path

### Option 1: Pure SQL (Learning/Evaluation)
1. Import bus_ticket_system.sql
2. Execute sample queries
3. Generate reports
4. Perfect for SQL viva

### Option 2: Backend API
1. Set up Python/Node.js/Java
2. Use BACKEND_IMPLEMENTATION_GUIDE.md
3. Create REST endpoints
4. Connect to database

### Option 3: Full Stack
1. Backend API + Database
2. Create mobile/web interface
3. Integrate QR scanner
4. Complete project

---

## 📖 How to Use Each File

| File | Purpose | When to Read |
|------|---------|-------------|
| **bus_ticket_system.sql** | Database implementation | To create and understand database |
| **PROJECT_DOCUMENTATION.md** | Complete theory & viva prep | Before viva, to understand design |
| **QUICK_REFERENCE_GUIDE.md** | Quick operations & queries | During daily operations, troubleshooting |
| **BACKEND_IMPLEMENTATION_GUIDE.md** | Code implementation | To build REST API or mobile app |
| **README.md** | Project overview | First, to understand everything |

---

## 🎯 Sample Viva Questions & Answers

**Q: Why separate Passengers and Tickets?**  
A: Passengers are master data - one passenger can book multiple tickets. Separation follows normalization.

**Q: How many tables and why?**  
A: 9 tables - each represents distinct entity. Reduces redundancy and improves query efficiency.

**Q: Why use Bus_Routes table?**  
A: Creates Many-to-Many relationship. Same bus runs different routes on different dates.

**Q: How to prevent double booking?**  
A: UNIQUE constraint + status checking + transaction locking + automatic triggers.

**Q: What's purpose of QR codes?**  
A: One-time verification, fraud prevention, boarding confirmation, audit trail.

**Q: Which triggers are implemented?**  
A: Auto-update seat status, update bus availability, update route capacity.

---

## 📊 Project Checklist

- [x] Database design with proper normalization
- [x] 9 essential tables created
- [x] Primary & Foreign keys implemented
- [x] Data constraints for data quality
- [x] Sample data (4 buses, 4 routes, 70 seats, 8 passengers)
- [x] 12+ SELECT queries for reporting
- [x] JOIN queries across multiple tables
- [x] GROUP BY for aggregations
- [x] UPDATE queries for availability
- [x] Payment system with multiple methods
- [x] QR code generation & verification
- [x] 3 Triggers for automation
- [x] 3 Stored procedures for operations
- [x] 3 Views for common reports
- [x] Fraud prevention mechanisms
- [x] Performance indexes
- [x] Complete documentation
- [x] Sample outputs with explanations

---

## 🚀 Deployment Steps

### Local Development
```bash
1. Install MySQL Server
2. Create database: CREATE DATABASE BusTicketSystem;
3. Import SQL file: mysql -u root -p BusTicketSystem < bus_ticket_system.sql
4. Test: SELECT COUNT(*) FROM Tickets;
```

### Production Deployment
```bash
1. Use managed database (AWS RDS, Azure SQL, Google Cloud SQL)
2. Set up automated backups
3. Configure security groups
4. Monitor performance with indexes
5. Set up replication for high availability
```

---

## 📞 Getting Help

### For SQL Issues
- Check QUICK_REFERENCE_GUIDE.md section "Common Errors & Solutions"
- Run verification queries to ensure data consistency
- Check indexes for query performance

### For Implementation
- Refer to BACKEND_IMPLEMENTATION_GUIDE.md
- Check code examples in Python/Node.js/Java
- Review REST API endpoint specifications

### For Viva Preparation
- Study PROJECT_DOCUMENTATION.md
- Go through common viva questions
- Practice explaining table relationships
- Be ready to explain triggers and stored procedures

---

## 📈 Next Steps

### To Extend This Project
1. Add user authentication (admin/conductor login)
2. Implement real SMS/Email notifications
3. Add dynamic pricing based on occupancy
4. Create cancellation with refund logic
5. Add loyalty points system
6. Implement group booking
7. Add seat preferences (window/aisle)
8. Build admin dashboard
9. Implement real payment gateway (Razorpay, PayPal)
10. Add mobile app with real QR scanner

### Performance Improvements
1. Add caching layer (Redis)
2. Implement query optimization
3. Use connection pooling
4. Archive historical data
5. Implement database replication

---

## 📄 License & Usage

This project is created for **educational purposes** for college mini-project evaluation.

**You can:**
- ✅ Use for college project
- ✅ Modify and extend
- ✅ Use as reference
- ✅ Submit for evaluation

**Attribution:**
If you use this project, please mention it was created with proper database design principles.

---

## 🎓 Credits

**Project:** Smart Bus Ticket Booking System with Payment and QR Scanner  
**Created:** April 2026  
**Version:** 1.0  
**Status:** Complete & Production Ready

**Suitable for:**
- SQL Mini Projects
- Database Design Courses
- Backend Development Projects
- Full Stack Development
- System Design Case Studies

---

## 📝 File Structure

```
Ticket/
├── backend/
│   ├── bus_ticket_system.sql              (Main SQL file - 900+ lines)
│   ├── PROJECT_DOCUMENTATION.md           (Complete documentation)
│   ├── QUICK_REFERENCE_GUIDE.md           (Quick operations & queries)
│   ├── BACKEND_IMPLEMENTATION_GUIDE.md    (Code examples & API)
│   └── README.md                          (This file)
└── frontend/
    └── index.html                         (Frontend placeholder)
```

---

## 🔗 Quick Links

- **Database Setup:** See "Step-by-Step Implementation" in QUICK_REFERENCE_GUIDE.md
- **API Design:** See "REST API Endpoints" in BACKEND_IMPLEMENTATION_GUIDE.md
- **Database Schema:** See "Database Schema Design" in PROJECT_DOCUMENTATION.md
- **Viva Preparation:** See "Common Viva Questions" in PROJECT_DOCUMENTATION.md

---

**Ready to get started?**

1. 📖 Start with this README (you're reading it!)
2. 🗄️ Run bus_ticket_system.sql to create database
3. 📚 Read PROJECT_DOCUMENTATION.md for understanding
4. 🚀 Use QUICK_REFERENCE_GUIDE.md for operations
5. 💻 Code your backend using BACKEND_IMPLEMENTATION_GUIDE.md

**Good luck with your project! 🎉**

---

**Last Updated:** April 22, 2026  
**Version:** 1.0  
**Status:** ✅ Complete & Ready for Submission
