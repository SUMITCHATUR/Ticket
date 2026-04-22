# 🚀 PostgreSQL Setup - Complete Step-by-Step Guide
## Smart Bus Ticket Booking System

---

## 📋 STEP 1: PostgreSQL Install करो (Windows)

### Option A: Direct Installation (Recommended)

**Link:** https://www.postgresql.org/download/windows/

1. **Download करो:**
   - Latest version (16.x या 15.x) download करो
   - File size: ~100MB

2. **Installer चलाओ:**
   ```
   Double-click on PostgreSQL installer
   ```

3. **Installation Wizard:**
   ```
   Welcome → Next
   Installation Directory: C:\Program Files\PostgreSQL\16 (Default OK)
   → Next
   ```

4. **Components Select करो:**
   ```
   ✓ PostgreSQL Server
   ✓ pgAdmin 4 (GUI Tool - Important!)
   ✓ Stack Builder (Optional)
   ✓ Command Line Tools
   → Next
   ```

5. **Data Directory:**
   ```
   Default: C:\Program Files\PostgreSQL\16\data
   → Next
   ```

6. **Password Set करो:**
   ```
   Username: postgres (default)
   Password: YourPassword123  ← याद रखो यह password!
   Confirm: YourPassword123
   → Next
   ```

7. **Port Number:**
   ```
   Default: 5432 (OK है)
   → Next
   ```

8. **Locale:**
   ```
   English, United States
   → Next → Install
   ```

9. **Wait करो:** Installation 2-3 minutes लेगी

10. **Finish:** 
    ```
    ✓ Launch Stack Builder? → NO (पहले database setup करेंगे)
    ```

### ✅ Verification:

```
Windows में search करो: "pgAdmin 4"
→ Opens तो installation successful है ✅
```

---

## 📊 STEP 2: pgAdmin 4 खोलो (GUI Tool)

pgAdmin एक visual tool है जहां आप databases, tables, data देख और manage कर सकते हो।

### Step A: pgAdmin 4 Launch करो

```
Start Menu → pgAdmin 4 → Click

या

Browser में: http://localhost:5050
```

### Step B: Login करो

```
Username (Email): postgres
Password: YourPassword123 (जो आपने install के time दिया था)
→ Login
```

### Step C: Interface दिखेगा

```
Left Panel में:
├── Servers
│   └── PostgreSQL 16
│       ├── Databases
│       ├── Login/Group Roles
│       └── ...
```

---

## 🗄️ STEP 3: Database Create करो

### Method 1: pgAdmin से (Easy - Recommended)

**Step A: Right-click करो**
```
Left Panel में → Servers → PostgreSQL 16 → Databases
→ Right-click → Create → Database
```

**Step B: Database Details भरो**
```
Name: bus_ticket_system
Owner: postgres
Encoding: UTF8
```

**Step C: Create बटन दबाओ**
```
→ Save/Create
```

**✅ Done!** Database बन गया

### Method 2: Command Line से (Advanced)

**Windows Command Prompt खोलो:**

```powershell
# PostgreSQL bin directory में जाओ
cd "C:\Program Files\PostgreSQL\16\bin"

# PostgreSQL client से connect करो
psql -U postgres

# अब PostgreSQL shell में हो
postgres=#

# Database create करो
CREATE DATABASE bus_ticket_system;

# List देखो
\l

# Exit करो
\q
```

**Output दिखेगा:**
```
CREATE DATABASE
postgres=# \l
                                            List of databases
       Name       | Owner    | Encoding |   Collate   |    Ctype    | ICU Locale | Provision |
------------------+----------+----------+-------------+-------------+------------+-----------+
 bus_ticket_system| postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |            | t
 postgres         | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |            | t
 template0        | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |            | t
 template1        | postgres | UTF8     | en_US.UTF-8 | en_US.UTF-8 |            | t
```

---

## 💾 STEP 4: SQL File को Execute करो

अब आपके सभी tables, data automatically create हो जाएंगे।

### Method 1: pgAdmin से (Easiest)

**Step A: Query Tool खोलो**
```
Left Panel → Databases → bus_ticket_system
→ Right-click → Query Tool
```

**Step B: SQL File को copy-paste करो**
```
C:\Users\SUMIT CHATUR\Ticket\backend\bus_ticket_system_postgresql.sql
को खोलो → सभी code copy करो
```

**Step C: pgAdmin में paste करो**
```
Query Tool window में:
Ctrl+A → Delete करो
Ctrl+V → Paste करो
```

**Step D: Execute करो**
```
Top में "Execute" बटन दबाओ (या F5)
या Ctrl+Enter
```

**⏳ Wait करो:** 10-20 seconds

**✅ Success! Output:**
```
CREATE TYPE
CREATE TABLE
INSERT 0 4
INSERT 0 8
... etc
```

### Method 2: Command Line से (Advanced)

```powershell
# PowerShell खोलो

# File के साथ execute करो
psql -U postgres -d bus_ticket_system -f "C:\Users\SUMIT CHATUR\Ticket\backend\bus_ticket_system_postgresql.sql"

# Enter password: YourPassword123

# Wait करो...

# Success message आएगा
```

---

## ✅ STEP 5: Verify करो - सब कुछ ठीक है या नहीं

### Test Query 1: Tables देखो

**pgAdmin Query Tool में:**

```sql
-- सभी tables की list
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Expected Output (9 tables):**
```
           table_name           
---------------------------------
 conductors
 buses
 routes
 bus_routes
 seats
 passengers
 tickets
 payments
 qr_codes
```

### Test Query 2: Data Count करो

```sql
-- कितने records हैं
SELECT 
  (SELECT COUNT(*) FROM conductors) as conductors,
  (SELECT COUNT(*) FROM buses) as buses,
  (SELECT COUNT(*) FROM routes) as routes,
  (SELECT COUNT(*) FROM passengers) as passengers,
  (SELECT COUNT(*) FROM tickets) as tickets,
  (SELECT COUNT(*) FROM payments) as payments,
  (SELECT COUNT(*) FROM qr_codes) as qr_codes;
```

**Expected Output:**
```
 conductors | buses | routes | passengers | tickets | payments | qr_codes
------------+-------+--------+------------+---------+----------+----------
          4 |     4 |      4 |          8 |       8 |        8 |        8
```

### Test Query 3: Ticket Details देखो

```sql
-- सभी tickets की details
SELECT 
  t.ticket_number,
  p.passenger_name,
  s.seat_number,
  b.bus_number,
  r.route_name
FROM tickets t
JOIN passengers p ON t.passenger_id = p.passenger_id
JOIN seats s ON t.seat_id = s.seat_id
JOIN buses b ON s.bus_id = b.bus_id
JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
JOIN routes r ON br.route_id = r.route_id;
```

**Expected Output:**
```
 ticket_number | passenger_name | seat_number | bus_number |      route_name      
---------------+----------------+-------------+------------+---------------------
 TKT-001       | Amit Sharma    | A1          | BUS-001    | Mumbai-Pune Express
 TKT-002       | Sneha Gupta    | A2          | BUS-001    | Mumbai-Pune Express
 TKT-003       | Rohan Verma    | B1          | BUS-001    | Mumbai-Pune Express
 ... (8 total)
```

✅ **सब कुछ perfect है!**

---

## 🎯 STEP 6: Basic Operations करो

### Query 1: Available Seats देखो (Route 1 के लिए)

```sql
SELECT seat_number, status
FROM seats
WHERE bus_id = 1 AND status = 'Available'
ORDER BY seat_number;
```

**Output:**
```
 seat_number | status
-------------+-----------
 C1          | Available
 C2          | Available
 C3          | Available
 D1          | Available
 ... etc
```

### Query 2: Revenue Report देखो

```sql
SELECT 
  r.route_name,
  COUNT(t.ticket_id) as tickets,
  SUM(pay.payment_amount) as revenue
FROM routes r
JOIN bus_routes br ON r.route_id = br.route_id
LEFT JOIN tickets t ON br.bus_route_id = t.bus_route_id
LEFT JOIN payments pay ON t.ticket_id = pay.ticket_id
WHERE pay.payment_status = 'Success'
GROUP BY r.route_id, r.route_name
ORDER BY revenue DESC;
```

**Output:**
```
      route_name       | tickets | revenue
-----------------------+---------+---------
 Mumbai-Pune Express   |       3 |    1500
 Delhi-Agra Express    |       2 |    1400
 Chennai-Coimbatore    |       2 |    1100
 Bangalore-Hyderabad   |       1 |    1200
```

### Query 3: Bus Occupancy देखो

```sql
SELECT 
  b.bus_number,
  COUNT(CASE WHEN s.status = 'Booked' THEN 1 END) as booked,
  COUNT(CASE WHEN s.status = 'Available' THEN 1 END) as available
FROM buses b
LEFT JOIN seats s ON b.bus_id = s.bus_id
GROUP BY b.bus_id, b.bus_number;
```

**Output:**
```
 bus_number | booked | available
------------+--------+-----------
 BUS-001    |      3 |        42
 BUS-002    |      2 |        28
 BUS-003    |      1 |        49
 BUS-004    |      2 |        38
```

---

## 🔧 STEP 7: Functions (Procedures) Test करो

### Function 1: Get Available Seats

```sql
-- Route 1 के available seats देखो
SELECT * FROM get_available_seats(1);
```

**Output:**
```
 seat_id | seat_number | seat_type | bus_number | route_name          | source_city | destination_city | departure_time
---------+-------------+-----------+------------+---------------------+-------------+------------------+----------------
       7 | C1          | Window    | BUS-001    | Mumbai-Pune Express | Mumbai      | Pune             | 09:00:00
       8 | C2          | Middle    | BUS-001    | Mumbai-Pune Express | Mumbai      | Pune             | 09:00:00
       ... etc
```

### Function 2: Scan QR Code

```sql
-- QR scan करो (पहली बार - valid)
SELECT * FROM scan_qr_code('QR-2026-04-25-001', 1);
```

**Output:**
```
            status             | passenger_name
-------------------------------+----------------
 QR Scanned Successfully        | Amit Sharma
```

---

## 🛠️ STEP 8: Troubleshooting

### Problem 1: Password भूल गए

```powershell
# PostgreSQL client खोलो (pgAdmin से)
# psql command line में switch करो
# Or reset password:

# Administrator mode में Command Prompt खोलो
cd "C:\Program Files\PostgreSQL\16\bin"
psql -U postgres

-- New password set करो
ALTER USER postgres PASSWORD 'NewPassword123';
```

### Problem 2: Database connect नहीं हो रहा

```sql
-- Check करो कि PostgreSQL service चल रही है या नहीं
-- Windows Services खोलो (services.msc)
-- "postgresql-x64-16" को देखो
-- Status: Running होना चाहिए

-- अगर नहीं है तो start करो
-- Right-click → Start
```

### Problem 3: SQL Queries में Error आ रहा है

```
Error: relation "table_name" does not exist

Solution:
1. Database select किया है? (bus_ticket_system)
2. Table exists करता है? (SELECT * FROM information_schema.tables)
3. Spelling ठीक है? (case-sensitive नहीं है PostgreSQL)
```

---

## 📱 STEP 9: अब Backend API बनाओ (Optional)

अगर आप अपना application बनाना चाहते हो:

### Python Flask Example

```python
from flask import Flask, jsonify
import psycopg2

app = Flask(__name__)

# Database connection
def get_db():
    conn = psycopg2.connect(
        host="localhost",
        database="bus_ticket_system",
        user="postgres",
        password="YourPassword123"
    )
    return conn

@app.route('/api/routes', methods=['GET'])
def get_routes():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT route_id, route_name, source_city, destination_city FROM routes;")
    routes = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify(routes)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

---

## 📚 STEP 10: Important PostgreSQL Commands

### Connection

```sql
-- PostgreSQL shell खोलो
psql -U postgres

-- Specific database में enter करो
\c bus_ticket_system

-- Databases की list देखो
\l

-- Tables की list देखो
\dt

-- Tables + views की list
\d

-- Specific table की structure देखो
\d seats

-- SQL file execute करो
\i /path/to/file.sql

-- Exit करो
\q
```

### Queries

```sql
-- सभी databases
SELECT datname FROM pg_database;

-- सभी tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- सभी functions/procedures
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- सभी views
SELECT table_name FROM information_schema.views WHERE table_schema = 'public';
```

---

## 🎓 Complete Setup Checklist

- [ ] PostgreSQL installed
- [ ] pgAdmin 4 accessible
- [ ] bus_ticket_system database created
- [ ] SQL file executed
- [ ] 9 tables created (verified)
- [ ] 8 sample records in each table
- [ ] Test queries successful
- [ ] Functions working
- [ ] Database backup लिया

---

## 📝 Summary - क्या-क्या किया

```
1. PostgreSQL install किया ✓
2. pgAdmin 4 खोला ✓
3. bus_ticket_system database बनाया ✓
4. bus_ticket_system_postgresql.sql execute किया ✓
5. सभी 9 tables create हुए ✓
6. 8 sample bookings insert हुई ✓
7. 3 functions, 3 triggers, 3 views create हुए ✓
8. Test queries चलाएं ✓
9. Success! ✓
```

---

## 🚀 Next Steps

अगले step:

1. **Backend API बनाओ** (Python/Node.js)
2. **REST endpoints create करो** (booking, qr scan, reports)
3. **Frontend interface बनाओ** (conductor app)
4. **Mobile app integrate करो** (QR scanner)

---

## ❓ Common Questions

**Q: PostgreSQL vs MySQL - कौन बेहतर है?**  
A: दोनों अच्छे हैं। PostgreSQL advanced features देता है, MySQL simpler है।

**Q: Database backup कैसे लूं?**  
A: pgAdmin → Database → Backup → अपने आप backup create हो जाएगा

**Q: Multiple databases बना सकते हैं?**  
A: हाँ, same process से दूसरे databases बना सकते हो

**Q: Data को modify कैसे करूं?**  
A: Direct queries से: `UPDATE tables SET column = value WHERE condition;`

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| PostgreSQL खोलो | `psql -U postgres` |
| Database choose करो | `\c bus_ticket_system` |
| Tables देखो | `\dt` |
| SQL file run करो | `\i /path/file.sql` |
| Query run करो | `SELECT * FROM tables;` |
| Exit करो | `\q` |

---

**Abhi setup complete! अब queries चला सकते हो! 🎉**

Koi aur help chahiye? 👀
