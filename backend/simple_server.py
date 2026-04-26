#!/usr/bin/env python3
"""
Simple FastAPI Server for Bus Ticket System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from datetime import datetime

# Create simple FastAPI app
app = FastAPI(
    title="Bus Ticket Booking System API",
    description="Simple API for Frontend Testing",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
mock_routes = [
    {
        "id": 1,
        "route_name": "Mumbai to Pune Express",
        "source_city": "Mumbai",
        "destination_city": "Pune",
        "distance_km": 150,
        "base_fare": 550,
        "travel_date": "2024-04-22",
        "departure_time": "14:30:00",
        "arrival_time": "17:30:00",
        "status": "Active"
    },
    {
        "id": 2,
        "route_name": "Mumbai to Nashik",
        "source_city": "Mumbai",
        "destination_city": "Nashik",
        "distance_km": 180,
        "base_fare": 420,
        "travel_date": "2024-04-22",
        "departure_time": "09:00:00",
        "arrival_time": "12:30:00",
        "status": "Active"
    },
    {
        "id": 3,
        "route_name": "Mumbai to Ahmedabad",
        "source_city": "Mumbai",
        "destination_city": "Ahmedabad",
        "distance_km": 525,
        "base_fare": 850,
        "travel_date": "2024-04-22",
        "departure_time": "08:00:00",
        "arrival_time": "18:00:00",
        "status": "Active"
    }
]

mock_tickets = [
    {
        "id": 1,
        "ticket_number": "TKT-20240422-001",
        "passenger_name": "Rahul Sharma",
        "route": "Mumbai to Pune",
        "bus_number": "MH-12-AB-1234",
        "seat_number": "15A",
        "amount": 550,
        "payment_method": "UPI",
        "status": "Confirmed",
        "booking_date": "2024-04-22",
        "booking_time": "10:30 AM",
        "journey_date": "2024-04-22",
        "departure_time": "14:30"
    }
]

# API Endpoints
@app.get("/")
def read_root():
    return {
        "message": "Bus Ticket Booking System API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "Connected (Mock)",
        "payment_gateway": "active",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/auth/login")
def login(credentials: dict):
    username = credentials.get("username")
    password = credentials.get("password")
    
    if username in ["admin", "conductor"] and password in ["admin123", "conductor123"]:
        return {
            "access_token": "mock_token_12345",
            "token_type": "bearer"
        }
    else:
        return {"detail": "Invalid credentials"}, 401

@app.get("/auth/me")
def get_current_user():
    return {
        "username": "admin",
        "full_name": "System Administrator",
        "email": "admin@busticket.com",
        "disabled": False
    }

@app.get("/routes/")
def get_routes():
    return mock_routes

@app.get("/routes/{route_id}/available-seats")
def get_available_seats(route_id: int):
    # Mock seat data
    seats = []
    for i in range(1, 41):
        is_booked = i % 7 == 0  # Some seats are booked
        seats.append({
            "id": i,
            "seat_number": f"{chr(65 + ((i - 1) % 4))}{(i - 1) // 4 + 1}",
            "seat_type": "Window" if i % 3 == 0 else "Aisle" if i % 2 == 0 else "Middle",
            "status": "booked" if is_booked else "available"
        })
    return seats

@app.post("/tickets/book-with-payment")
def book_ticket(data: dict):
    return {
        "success": True,
        "ticket": {
            "ticket_id": 123,
            "ticket_number": "TKT-20240422-002",
            "passenger": data.get("booking_request", {}).get("passenger", {}).get("passenger_name", "Test User"),
            "route": "Mumbai to Pune",
            "bus": "MH-12-AB-1234",
            "seat": "15A",
            "amount": 550,
            "paymentMethod": "UPI"
        }
    }

@app.post("/payment/create")
def create_payment(payment_data: dict):
    return {
        "success": True,
        "payment_id": "PAY_20240422_123",
        "transaction_id": "TXN_20240422_456",
        "qr_code_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        "expires_at": "2024-04-22T12:00:00"
    }

@app.get("/tickets/")
def get_tickets():
    return mock_tickets

@app.get("/payments/summary")
def get_payment_summary():
    return [
        {
            "payment_method": "UPI",
            "total_transactions": 45,
            "total_amount": 24500,
            "average_amount": 544.44,
            "successful": 42,
            "failed": 2,
            "pending": 1
        }
    ]

@app.get("/revenue/by-route")
def get_revenue_by_route():
    return [
        {
            "route_id": 1,
            "route_name": "Mumbai to Pune",
            "source_city": "Mumbai",
            "destination_city": "Pune",
            "total_tickets": 28,
            "total_revenue": 15400,
            "average_fare": 550.00
        }
    ]

if __name__ == "__main__":
    print("Starting Simple Bus Ticket System API on port 8001")
    print("Frontend can connect to: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
