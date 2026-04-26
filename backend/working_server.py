#!/usr/bin/env python3
"""
Working FastAPI Server for Bus Ticket System
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
from datetime import datetime, date
import uuid
import hashlib

# Create FastAPI app
app = FastAPI(
    title="Bus Ticket Booking System API",
    description="Working API for Frontend Testing",
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

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    username: str
    full_name: str
    email: str
    disabled: bool = False

class UserWithRole(User):
    role: str

# Mock data
MOCK_ROUTES = [
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
    },
    {
        "id": 4,
        "route_name": "Pune to Chhatrapati Sambhajinagar",
        "source_city": "Pune",
        "destination_city": "Chhatrapati Sambhajinagar",
        "distance_km": 235,
        "base_fare": 480,
        "travel_date": "2024-04-22",
        "departure_time": "07:30:00",
        "arrival_time": "12:00:00",
        "status": "Active"
    },
    {
        "id": 5,
        "route_name": "Mumbai to Nagpur (Vidarbha Express)",
        "source_city": "Mumbai",
        "destination_city": "Nagpur",
        "distance_km": 830,
        "base_fare": 1250,
        "travel_date": "2024-04-22",
        "departure_time": "20:00:00",
        "arrival_time": "09:00:00",
        "status": "Active"
    },
    {
        "id": 6,
        "route_name": "Nagpur to Mumbai (Overnight)",
        "source_city": "Nagpur",
        "destination_city": "Mumbai",
        "distance_km": 830,
        "base_fare": 1250,
        "travel_date": "2024-04-22",
        "departure_time": "19:30:00",
        "arrival_time": "08:30:00",
        "status": "Active"
    },
    {
        "id": 7,
        "route_name": "Mumbai to Chhatrapati Sambhajinagar",
        "source_city": "Mumbai",
        "destination_city": "Chhatrapati Sambhajinagar",
        "distance_km": 335,
        "base_fare": 650,
        "travel_date": "2024-04-22",
        "departure_time": "06:45:00",
        "arrival_time": "12:15:00",
        "status": "Active"
    },
    {
        "id": 8,
        "route_name": "Pune to Nagpur",
        "source_city": "Pune",
        "destination_city": "Nagpur",
        "distance_km": 715,
        "base_fare": 1100,
        "travel_date": "2024-04-22",
        "departure_time": "21:15:00",
        "arrival_time": "08:45:00",
        "status": "Active"
    },
    {
        "id": 9,
        "route_name": "Nashik to Pune",
        "source_city": "Nashik",
        "destination_city": "Pune",
        "distance_km": 210,
        "base_fare": 380,
        "travel_date": "2024-04-22",
        "departure_time": "10:00:00",
        "arrival_time": "14:00:00",
        "status": "Active"
    }
]

MOCK_TICKETS = [
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

# In-memory token store for demo usage (token -> user profile)
TOKENS: dict[str, UserWithRole] = {}

USERS: dict[str, UserWithRole] = {
    "admin": UserWithRole(
        username="admin",
        full_name="System Administrator",
        email="admin@busticket.com",
        disabled=False,
        role="admin",
    ),
    "conductor": UserWithRole(
        username="conductor",
        full_name="Bus Conductor",
        email="conductor@busticket.com",
        disabled=False,
        role="conductor",
    ),
}

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
        "qr_generator": "active",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/auth/login")
def login(credentials: LoginRequest):
    username = credentials.username
    password = credentials.password
    
    valid = (
        (username == "admin" and password == "admin123")
        or (username == "conductor" and password == "conductor123")
    )
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = f"mock_token_{username}_{uuid.uuid4().hex[:8]}"
    TOKENS[token] = USERS[username]
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me")
def get_current_user(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "", 1).strip()
    user = TOKENS.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user.model_dump()

@app.get("/routes/")
def get_routes(from_city: Optional[str] = Query(default=None, alias="from"), to_city: Optional[str] = Query(default=None, alias="to")):
    # If no filters, return the seeded mock routes only (keeps payload small)
    if not from_city and not to_city:
        return MOCK_ROUTES

    def norm(s: str) -> str:
        return "".join(ch for ch in str(s or "").lower().strip() if ch.isalnum())

    f = norm(from_city) if from_city else ""
    t = norm(to_city) if to_city else ""

    filtered = []
    for r in MOCK_ROUTES:
        src = norm(r.get("source_city", ""))
        dst = norm(r.get("destination_city", ""))
        if f and f not in src:
            continue
        if t and t not in dst:
            continue
        filtered.append(r)

    # If user provided both cities and nothing matched, auto-generate a route
    if from_city and to_city and len(filtered) == 0:
        seed = f"{from_city}::{to_city}".encode("utf-8")
        h = int(hashlib.sha256(seed).hexdigest()[:8], 16)

        # Deterministic but fake values (good for demo)
        distance_km = 60 + (h % 840)  # 60..899
        base_fare = int(distance_km * 1.6)  # simple fare formula
        dep_hour = 6 + (h % 14)  # 6..19
        dep_min = (h // 17) % 60
        travel_hours = max(2, int(distance_km / 55))
        arr_hour = (dep_hour + travel_hours) % 24

        dep = f"{dep_hour:02d}:{dep_min:02d}:00"
        arr = f"{arr_hour:02d}:{dep_min:02d}:00"

        filtered.append({
            "id": 100000 + (h % 900000),
            "route_name": f"{from_city} to {to_city}",
            "source_city": from_city,
            "destination_city": to_city,
            "distance_km": distance_km,
            "base_fare": base_fare,
            "travel_date": "2024-04-22",
            "departure_time": dep,
            "arrival_time": arr,
            "status": "Active"
        })

    return filtered

@app.get("/routes/{route_id}/available-seats")
def get_available_seats(route_id: int):
    # Mock seat data
    seats = []
    for i in range(1, 41):
        is_booked = i % 7 == 0  # Some seats are booked
        seat_row = (i - 1) // 4 + 1
        seat_col = chr(65 + ((i - 1) % 4))
        
        seats.append({
            "id": i,
            "seat_number": f"{seat_col}{seat_row}",
            "seat_type": "Window" if i % 3 == 0 else "Aisle" if i % 2 == 0 else "Middle",
            "status": "booked" if is_booked else "available"
        })
    return seats

@app.post("/tickets/book-with-payment")
def book_ticket(data: dict):
    booking_request = data.get("booking_request", {})
    payment_request = data.get("payment_request", {})
    
    passenger = booking_request.get("passenger", {})
    
    return {
        "success": True,
        "ticket": {
            "ticket_id": 123,
            "ticket_number": f"TKT-{datetime.now().strftime('%Y%m%d')}-002",
            "passenger": passenger.get("passenger_name", "Test User"),
            "route": "Mumbai to Pune",
            "bus": "MH-12-AB-1234",
            "seat": "15A",
            "amount": booking_request.get("ticket_price", 550),
            "paymentMethod": payment_request.get("payment_method", "UPI")
        }
    }

@app.post("/payment/create")
def create_payment(payment_data: dict):
    return {
        "success": True,
        "payment_id": f"PAY_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:6].upper()}",
        "transaction_id": f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:4].upper()}",
        "qr_code_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        "expires_at": (datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)).isoformat()
    }

@app.get("/tickets/")
def get_tickets():
    return MOCK_TICKETS

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
        },
        {
            "payment_method": "Cash",
            "total_transactions": 32,
            "total_amount": 16800,
            "average_amount": 525.00,
            "successful": 32,
            "failed": 0,
            "pending": 0
        },
        {
            "payment_method": "Online",
            "total_transactions": 18,
            "total_amount": 9900,
            "average_amount": 550.00,
            "successful": 17,
            "failed": 1,
            "pending": 0
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
        },
        {
            "route_id": 2,
            "route_name": "Mumbai to Nashik",
            "source_city": "Mumbai",
            "destination_city": "Nashik",
            "total_tickets": 22,
            "total_revenue": 9240,
            "average_fare": 420.00
        },
        {
            "route_id": 3,
            "route_name": "Mumbai to Ahmedabad",
            "source_city": "Mumbai",
            "destination_city": "Ahmedabad",
            "total_tickets": 15,
            "total_revenue": 12750,
            "average_fare": 850.00
        }
    ]

@app.get("/conductors/")
def get_conductors():
    return [
        {
            "conductor_id": 1,
            "conductor_name": "Rajesh Kumar",
            "employee_id": "EMP001",
            "contact_number": "9876543210",
            "email": "rajesh@busticket.com",
            "status": "Active",
            "joining_date": "2023-01-15"
        }
    ]

if __name__ == "__main__":
    print("Starting Working Bus Ticket System API on port 8001")
    print("Frontend can connect to: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Trying alternative port 8002...")
        uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
