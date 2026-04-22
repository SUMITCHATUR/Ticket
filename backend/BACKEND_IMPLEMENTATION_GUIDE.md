# Backend Implementation Guide
## Smart Bus Ticket Booking System - Developer Reference

---

## 🚀 QUICK START

### For Python (Using MySQL connector)
```python
import mysql.connector
from datetime import datetime

# Database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="BusTicketSystem"
)

cursor = db.cursor(dictionary=True)

# Example 1: Book a ticket
def book_ticket(passenger_name, contact, age, gender, id_type, id_number,
                bus_route_id, seat_id, conductor_id, payment_method, transaction_id, price):
    try:
        cursor.callproc('BookTicket', [
            passenger_name, contact, age, gender, id_type, id_number,
            bus_route_id, seat_id, conductor_id, payment_method, transaction_id, price
        ])
        db.commit()
        result = cursor.fetchone()
        return result
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

# Example 2: Get available seats
def get_available_seats(route_id):
    query = """
    SELECT s.seat_id, s.seat_number, s.seat_type, b.bus_number
    FROM Seats s
    JOIN Buses b ON s.bus_id = b.bus_id
    JOIN Bus_Routes br ON b.bus_id = br.bus_id
    JOIN Routes r ON br.route_id = r.route_id
    WHERE r.route_id = %s AND s.status = 'Available'
    ORDER BY s.seat_number
    """
    cursor.execute(query, (route_id,))
    return cursor.fetchall()

# Example 3: Scan QR code
def scan_qr_code(qr_code_id, conductor_id):
    try:
        cursor.callproc('ScanQRCode', [qr_code_id, conductor_id])
        db.commit()
        result = cursor.fetchone()
        return result
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

# Usage
ticket = book_ticket('John Doe', '9876543210', 30, 'Male', 'Aadhar', 
                     '523456789012', 1, 5, 1, 'Cash', 'TXN-001', 500.00)
print(ticket)
```

### For Node.js (Using mysql2 or mysql)
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'BusTicketSystem',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Example 1: Book a ticket
async function bookTicket(passengerData) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `CALL BookTicket(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        passengerData.name,
        passengerData.contact,
        passengerData.age,
        passengerData.gender,
        passengerData.idType,
        passengerData.idNumber,
        passengerData.busRouteId,
        passengerData.seatId,
        passengerData.conductorId,
        passengerData.paymentMethod,
        passengerData.transactionId,
        passengerData.price
      ]
    );
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    connection.release();
  }
}

// Example 2: Get available seats
async function getAvailableSeats(routeId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT s.seat_id, s.seat_number, s.seat_type, b.bus_number
      FROM Seats s
      JOIN Buses b ON s.bus_id = b.bus_id
      JOIN Bus_Routes br ON b.bus_id = br.bus_id
      JOIN Routes r ON br.route_id = r.route_id
      WHERE r.route_id = ? AND s.status = 'Available'
      ORDER BY s.seat_number
    `, [routeId]);
    return rows;
  } finally {
    connection.release();
  }
}

// Example 3: Scan QR code
async function scanQRCode(qrCodeId, conductorId) {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `CALL ScanQRCode(?, ?)`,
      [qrCodeId, conductorId]
    );
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    connection.release();
  }
}

// Usage
async function main() {
  const ticketData = {
    name: 'John Doe',
    contact: '9876543210',
    age: 30,
    gender: 'Male',
    idType: 'Aadhar',
    idNumber: '523456789012',
    busRouteId: 1,
    seatId: 5,
    conductorId: 1,
    paymentMethod: 'Cash',
    transactionId: 'TXN-001',
    price: 500.00
  };
  
  const result = await bookTicket(ticketData);
  console.log(result);
}

main();
```

### For Java (Using JDBC)
```java
import java.sql.*;

public class BusTicketingDAO {
    private Connection conn;
    
    public BusTicketingDAO(Connection conn) {
        this.conn = conn;
    }
    
    // Example 1: Book ticket using stored procedure
    public Map<String, Object> bookTicket(String passengerName, String contact, 
                                          int age, String gender, String idType, 
                                          String idNumber, int busRouteId, 
                                          int seatId, int conductorId, 
                                          String paymentMethod, String transactionId, 
                                          double price) throws SQLException {
        String sql = "CALL BookTicket(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (CallableStatement cstmt = conn.prepareCall(sql)) {
            cstmt.setString(1, passengerName);
            cstmt.setString(2, contact);
            cstmt.setInt(3, age);
            cstmt.setString(4, gender);
            cstmt.setString(5, idType);
            cstmt.setString(6, idNumber);
            cstmt.setInt(7, busRouteId);
            cstmt.setInt(8, seatId);
            cstmt.setInt(9, conductorId);
            cstmt.setString(10, paymentMethod);
            cstmt.setString(11, transactionId);
            cstmt.setDouble(12, price);
            
            cstmt.execute();
            
            ResultSet rs = cstmt.getResultSet();
            Map<String, Object> result = new HashMap<>();
            if (rs.next()) {
                result.put("ticket_id", rs.getInt("ticket_id"));
                result.put("ticket_number", rs.getString("ticket_number"));
                result.put("qr_code", rs.getString("qr_code"));
            }
            return result;
        }
    }
    
    // Example 2: Get available seats
    public List<Map<String, Object>> getAvailableSeats(int routeId) throws SQLException {
        String sql = """
            SELECT s.seat_id, s.seat_number, s.seat_type, b.bus_number
            FROM Seats s
            JOIN Buses b ON s.bus_id = b.bus_id
            JOIN Bus_Routes br ON b.bus_id = br.bus_id
            JOIN Routes r ON br.route_id = r.route_id
            WHERE r.route_id = ? AND s.status = 'Available'
            ORDER BY s.seat_number
        """;
        
        List<Map<String, Object>> seats = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, routeId);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> seat = new HashMap<>();
                seat.put("seat_id", rs.getInt("seat_id"));
                seat.put("seat_number", rs.getString("seat_number"));
                seat.put("seat_type", rs.getString("seat_type"));
                seat.put("bus_number", rs.getString("bus_number"));
                seats.add(seat);
            }
        }
        return seats;
    }
    
    // Example 3: Scan QR code
    public Map<String, Object> scanQRCode(String qrCodeId, int conductorId) throws SQLException {
        String sql = "CALL ScanQRCode(?, ?)";
        
        try (CallableStatement cstmt = conn.prepareCall(sql)) {
            cstmt.setString(1, qrCodeId);
            cstmt.setInt(2, conductorId);
            
            cstmt.execute();
            
            ResultSet rs = cstmt.getResultSet();
            Map<String, Object> result = new HashMap<>();
            if (rs.next()) {
                result.put("status", rs.getString("status"));
                result.put("passenger_name", rs.getString("passenger_name"));
            }
            return result;
        }
    }
}
```

---

## 🔌 REST API ENDPOINTS

### 1. Get All Routes
```
GET /api/routes
Response: 200 OK
{
  "routes": [
    {
      "route_id": 1,
      "route_name": "Mumbai-Pune Express",
      "source_city": "Mumbai",
      "destination_city": "Pune",
      "departure_time": "09:00:00",
      "base_fare": 500.00,
      "available_capacity": 45
    }
  ]
}
```

### 2. Get Available Seats for Route
```
GET /api/routes/:routeId/seats
Response: 200 OK
{
  "seats": [
    {
      "seat_id": 1,
      "seat_number": "A1",
      "seat_type": "Window",
      "bus_number": "BUS-001"
    }
  ]
}
```

### 3. Book Ticket
```
POST /api/tickets/book
Body: {
  "passenger_name": "Amit Sharma",
  "contact_number": "9876543210",
  "age": 28,
  "gender": "Male",
  "id_type": "Aadhar",
  "id_number": "123456789012",
  "bus_route_id": 1,
  "seat_id": 1,
  "conductor_id": 1,
  "payment_method": "Cash",
  "transaction_id": "TXN-001",
  "ticket_price": 500.00
}

Response: 201 Created
{
  "success": true,
  "ticket_id": 1,
  "ticket_number": "TKT-001",
  "qr_code": "QR-2026-04-25-001",
  "message": "Ticket booked successfully"
}
```

### 4. Scan QR Code
```
POST /api/qr/scan
Body: {
  "qr_code_id": "QR-2026-04-25-001",
  "conductor_id": 1
}

Response: 200 OK
{
  "valid": true,
  "passenger_name": "Amit Sharma",
  "seat_number": "A1",
  "status": "Checked-In"
}

OR

Response: 400 Bad Request
{
  "valid": false,
  "message": "Ticket Already Used - Fraud Attempt"
}
```

### 5. Get Ticket History
```
GET /api/tickets/history?date=2026-04-25
Response: 200 OK
{
  "tickets": [
    {
      "ticket_id": 1,
      "ticket_number": "TKT-001",
      "passenger_name": "Amit Sharma",
      "seat_number": "A1",
      "journey_status": "Checked-In",
      "payment_status": "Success"
    }
  ]
}
```

### 6. Get Revenue Report
```
GET /api/reports/revenue?date=2026-04-23
Response: 200 OK
{
  "date": "2026-04-23",
  "total_revenue": 3300.00,
  "total_tickets": 6,
  "average_fare": 550.00,
  "payment_breakdown": {
    "cash": 3,
    "upi": 2,
    "online": 1
  }
}
```

### 7. Get Bus Occupancy
```
GET /api/buses/occupancy
Response: 200 OK
{
  "buses": [
    {
      "bus_id": 1,
      "bus_number": "BUS-001",
      "bus_type": "AC",
      "total_seats": 45,
      "booked_seats": 8,
      "occupancy_percentage": 17.78
    }
  ]
}
```

---

## 🔒 ERROR HANDLING

### Standard Error Response Format
```json
{
  "success": false,
  "error_code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "field_name",
    "issue": "specific issue"
  }
}
```

### Common Error Codes
```
ERR_001: Invalid Route ID
ERR_002: Seat Not Available
ERR_003: Insufficient Payment
ERR_004: Payment Failed
ERR_005: Invalid QR Code
ERR_006: Ticket Already Used
ERR_007: Database Connection Error
ERR_008: Duplicate Booking Attempt
ERR_009: Conductor Not Found
ERR_010: Bus Capacity Exceeded
```

### Error Handling Example (Python)
```python
from flask import Flask, jsonify, request
from mysql.connector import Error

app = Flask(__name__)

@app.route('/api/tickets/book', methods=['POST'])
def book_ticket_endpoint():
    try:
        data = request.get_json()
        
        # Validation
        if not all(key in data for key in ['passenger_name', 'contact_number']):
            return jsonify({
                'success': False,
                'error_code': 'ERR_001',
                'message': 'Missing required fields'
            }), 400
        
        # Process booking
        result = book_ticket(
            data['passenger_name'],
            data['contact_number'],
            data['age'],
            data['gender'],
            data['id_type'],
            data['id_number'],
            data['bus_route_id'],
            data['seat_id'],
            data['conductor_id'],
            data['payment_method'],
            data['transaction_id'],
            data['ticket_price']
        )
        
        if 'error' in result:
            return jsonify({
                'success': False,
                'error_code': 'ERR_008',
                'message': 'Booking failed: ' + result['error']
            }), 400
        
        return jsonify({
            'success': True,
            'ticket_id': result['ticket_id'],
            'ticket_number': result['ticket_number'],
            'qr_code': result['qr_code']
        }), 201
        
    except Error as e:
        return jsonify({
            'success': False,
            'error_code': 'ERR_007',
            'message': 'Database error occurred'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error_code': 'ERR_999',
            'message': 'Internal server error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error_code': 'ERR_404',
        'message': 'Endpoint not found'
    }), 404
```

---

## 🧪 UNIT TEST EXAMPLES

### Python (Using pytest)
```python
import pytest
from unittest.mock import Mock, patch
from booking_service import book_ticket, scan_qr_code

@pytest.fixture
def mock_db():
    with patch('booking_service.db') as mock:
        yield mock

def test_book_ticket_success(mock_db):
    mock_db.cursor.return_value.fetchone.return_value = {
        'ticket_id': 1,
        'ticket_number': 'TKT-001',
        'qr_code': 'QR-2026-04-25-001'
    }
    
    result = book_ticket('John', '1234567890', 30, 'Male', 'Aadhar', 
                        '123456789012', 1, 1, 1, 'Cash', 'TXN-001', 500)
    
    assert result['ticket_id'] == 1
    assert result['ticket_number'] == 'TKT-001'
    mock_db.commit.assert_called_once()

def test_scan_qr_success(mock_db):
    mock_db.cursor.return_value.fetchone.return_value = {
        'status': 'QR Scanned Successfully',
        'passenger_name': 'John Doe'
    }
    
    result = scan_qr_code('QR-2026-04-25-001', 1)
    
    assert result['status'] == 'QR Scanned Successfully'
    assert result['passenger_name'] == 'John Doe'

def test_scan_qr_already_used(mock_db):
    mock_db.cursor.return_value.fetchone.return_value = {
        'status': 'Invalid QR Code'
    }
    
    result = scan_qr_code('QR-2026-04-25-001', 1)
    
    assert result['status'] == 'Invalid QR Code'
```

### Java (Using JUnit)
```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class BusTicketingDAOTest {
    private BusTicketingDAO dao;
    private Connection mockConnection;
    
    @BeforeEach
    void setUp() {
        mockConnection = mock(Connection.class);
        dao = new BusTicketingDAO(mockConnection);
    }
    
    @Test
    void testBookTicketSuccess() throws SQLException {
        CallableStatement mockStmt = mock(CallableStatement.class);
        when(mockConnection.prepareCall(anyString())).thenReturn(mockStmt);
        
        ResultSet mockResultSet = mock(ResultSet.class);
        when(mockStmt.getResultSet()).thenReturn(mockResultSet);
        when(mockResultSet.next()).thenReturn(true);
        when(mockResultSet.getInt("ticket_id")).thenReturn(1);
        
        Map<String, Object> result = dao.bookTicket(
            "John", "1234567890", 30, "Male", "Aadhar", 
            "123456789012", 1, 1, 1, "Cash", "TXN-001", 500.0
        );
        
        assertEquals(1, result.get("ticket_id"));
        verify(mockStmt, times(1)).execute();
    }
}
```

---

## 📱 MOBILE APP INTEGRATION (React Native Example)

```javascript
import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import axios from 'axios';
import { Camera } from 'expo-camera';

const API_BASE = 'http://api.busticketing.com/api';

export function BookingScreen() {
  const [passenger, setPassenger] = useState({
    name: '',
    contact: '',
    age: '',
    gender: 'Male',
    idType: 'Aadhar',
    idNumber: ''
  });
  
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBookTicket = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/tickets/book`, {
        passenger_name: passenger.name,
        contact_number: passenger.contact,
        age: parseInt(passenger.age),
        gender: passenger.gender,
        id_type: passenger.idType,
        id_number: passenger.idNumber,
        bus_route_id: selectedRoute.bus_route_id,
        seat_id: selectedSeat.seat_id,
        conductor_id: 1, // From login
        payment_method: 'Cash',
        transaction_id: 'TXN-' + Date.now(),
        ticket_price: selectedRoute.base_fare
      });
      
      Alert.alert('Success', `Ticket: ${response.data.ticket_number}`);
      // Display QR code
      displayQRCode(response.data.qr_code);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput 
        placeholder="Passenger Name"
        value={passenger.name}
        onChangeText={(text) => setPassenger({...passenger, name: text})}
      />
      {/* More input fields... */}
      <Button 
        title={loading ? "Booking..." : "Book Ticket"}
        onPress={handleBookTicket}
        disabled={loading}
      />
    </View>
  );
}

export function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    
    try {
      const response = await axios.post(`${API_BASE}/qr/scan`, {
        qr_code_id: data,
        conductor_id: 1
      });
      
      if (response.data.valid) {
        Alert.alert(
          'Boarding Confirmed',
          `Passenger: ${response.data.passenger_name}\nSeat: ${response.data.seat_number}`
        );
      } else {
        Alert.alert('Invalid QR', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'QR Scan failed');
    }
    
    setTimeout(() => setScanned(false), 1500);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>Camera permission denied</Text>;
  }

  return (
    <Camera
      onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      style={{ flex: 1 }}
    />
  );
}
```

---

## 📊 REPORTING API

### Get Revenue Report
```python
@app.route('/api/reports/revenue', methods=['GET'])
def get_revenue():
    date = request.args.get('date', datetime.now().date())
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_tickets,
            SUM(payment_amount) as total_revenue,
            AVG(payment_amount) as avg_fare,
            COUNT(CASE WHEN payment_method='Cash' THEN 1 END) as cash_count,
            COUNT(CASE WHEN payment_method='UPI' THEN 1 END) as upi_count,
            COUNT(CASE WHEN payment_method='Online' THEN 1 END) as online_count
        FROM Payments
        WHERE DATE(payment_date) = %s AND payment_status = 'Success'
    """, (date,))
    
    result = cursor.fetchone()
    return jsonify({
        'date': str(date),
        'total_tickets': result['total_tickets'],
        'total_revenue': float(result['total_revenue']),
        'average_fare': float(result['avg_fare']),
        'payment_breakdown': {
            'cash': result['cash_count'],
            'upi': result['upi_count'],
            'online': result['online_count']
        }
    })
```

---

## 🔐 SECURITY BEST PRACTICES

```python
# 1. Use prepared statements to prevent SQL injection
def get_ticket_safe(ticket_id):
    cursor.execute("SELECT * FROM Tickets WHERE ticket_id = %s", (ticket_id,))
    # NOT: SELECT * FROM Tickets WHERE ticket_id = {ticket_id}

# 2. Hash sensitive data
from werkzeug.security import generate_password_hash, check_password_hash
hashed = generate_password_hash(passenger_id_number)

# 3. Use environment variables for DB credentials
import os
DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')

# 4. Implement rate limiting
from flask_limiter import Limiter
limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/api/qr/scan', methods=['POST'])
@limiter.limit("10 per minute")
def scan_qr():
    # Rate limited to 10 scans per minute

# 5. Use HTTPS in production
# 6. Implement JWT authentication
# 7. Log all critical operations
# 8. Validate all user inputs
```

---

## 🎓 INTERVIEW Q&A

**Q: How do you handle concurrent bookings?**
A: Using database-level locking (SELECT...FOR UPDATE) and UNIQUE constraints ensures no double-booking even with concurrent requests.

**Q: How is data consistency maintained?**
A: Triggers automatically update seat status and availability when tickets are booked, ensuring consistency without manual updates.

**Q: How do you prevent QR code fraud?**
A: QR status changes to 'Used' after first scan, preventing duplicate boarding. Audit trail records all scans.

**Q: What if payment processing fails?**
A: Transaction is rolled back using BEGIN/COMMIT, so ticket is not created if payment fails.

**Q: How do you handle refunds?**
A: Ticket status changes to 'Cancelled', payment status to 'Refunded', and seat status back to 'Available'.

---

**Version:** 1.0  
**Last Updated:** 2026-04-22
