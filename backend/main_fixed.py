from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, test_connection, SessionLocal, engine
from app import models
from app.payment_system import QRCodeGenerator, PaymentGateway, PaymentProcessor, PaymentResponse, UPIPaymentRequest, normalize_payment_method
from app.validators import TicketBookingRequest, PaymentRequest as ValidatorPaymentRequest
from app.simple_auth import get_current_active_user, check_admin_role, check_conductor_role, login_for_access_token, User, Token
from app.services import TicketBookingService, PaymentService
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime, timedelta
import logging
import urllib.parse
import os
import qrcode
import base64
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Bus Ticket Booking System",
    description="Smart Bus Ticket Booking System with Payment and QR Scanner",
    version="1.0.0"
)

@app.on_event("startup")
def initialize_app():
    try:
        models.Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            ensure_demo_routes(db)
        finally:
            db.close()
        logger.info("Startup initialization completed")
    except Exception as exc:
        logger.error(f"Startup initialization failed: {exc}")

frontend_origin = os.getenv("FRONTEND_URL")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ticketsbus.netlify.app",
]

if frontend_origin:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CombinedBookingRequest(BaseModel):
    booking_request: TicketBookingRequest
    payment_request: ValidatorPaymentRequest

def ensure_demo_routes(db: Session):
    """Ensure demo routes exist"""
    existing = db.execute(text("SELECT COUNT(*) FROM routes")).scalar()
    if existing > 0:
        return
    
    demo_routes = [
        {
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
    
    for route_data in demo_routes:
        route = models.Route(**route_data)
        db.add(route)
    
    db.commit()
    logger.info("Demo routes created")

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
        "database": "Connected",
        "payment_gateway": "active",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/auth/login")
@app.post("/api/auth/login")
def login(credentials: dict):
    username = credentials.get("username")
    password = credentials.get("password")
    
    if username in ["admin", "conductor"] and password in ["admin123", "conductor123"]:
        return {
            "access_token": "mock_token_12345",
            "token_type": "bearer"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/me")
@app.get("/api/auth/me")
def get_current_user():
    return {
        "username": "admin",
        "full_name": "System Administrator",
        "email": "admin@busticket.com",
        "disabled": False,
        "role": "admin"
    }

@app.get("/routes/")
@app.get("/api/routes/")
def get_routes(db: Session = Depends(get_db)):
    """Get all available routes"""
    query = text("""
        SELECT r.*, br.bus_route_id
        FROM routes r
        LEFT JOIN bus_routes br ON r.route_id = br.route_id
        WHERE r.status = 'Active'
        ORDER BY r.route_name
    """)
    
    result = db.execute(query)
    routes = result.fetchall()
    
    return [
        {
            "route_id": route[0],
            "route_name": route[1],
            "source_city": route[2],
            "destination_city": route[3],
            "distance_km": route[4],
            "base_fare": route[5],
            "travel_date": route[6],
            "departure_time": str(route[7]),
            "arrival_time": str(route[8]),
            "status": route[9],
            "bus_route_id": route[10]
        }
        for route in routes
    ]

@app.get("/routes/{route_id}/available-seats")
@app.get("/api/routes/{route_id}/available-seats")
def get_available_seats(route_id: int, db: Session = Depends(get_db)):
    """Get available seats for a specific route"""
    query = text("""
        SELECT 
            s.seat_id,
            s.seat_number,
            s.seat_type,
            b.bus_number,
            r.route_name,
            r.source_city,
            r.destination_city,
            r.departure_time,
            r.arrival_time,
            s.status
        FROM seats s
        JOIN buses b ON s.bus_id = b.bus_id
        JOIN bus_routes br ON b.bus_id = br.bus_id
        JOIN routes r ON br.route_id = r.route_id
        WHERE r.route_id = :route_id
        ORDER BY s.seat_number
    """)
    
    result = db.execute(query, {"route_id": route_id})
    seats = result.fetchall()
    
    # Check if any seats are already booked for this route
    booked_seat_ids = set()
    booked_check_query = text("""
        SELECT DISTINCT t.seat_id
        FROM tickets t
        JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
        WHERE br.route_id = :route_id AND t.journey_status = 'Booked'
    """)
    
    booked_result = db.execute(booked_check_query, {"route_id": route_id})
    for row in booked_result:
        booked_seat_ids.add(row[0])
    
    return [
        {
            "id": seat[0],
            "number": seat[1],
            "type": seat[2] or "Standard",
            "bus_number": seat[3],
            "route_name": seat[4],
            "source_city": seat[5],
            "destination_city": seat[6],
            "departure_time": str(seat[7]),
            "arrival_time": str(seat[8]),
            "status": "booked" if seat[0] in booked_seat_ids else "available"
        }
        for seat in seats
    ]

@app.post("/tickets/book-with-payment")
@app.post("/api/tickets/book-with-payment")
async def book_ticket_with_payment(
    combined: CombinedBookingRequest,
    db: Session = Depends(get_db)
):
    """Book ticket with integrated payment system - FIXED VERSION"""
    booking_request = combined.booking_request
    payment_request = combined.payment_request
    
    try:
        logger.info(f"Starting booking process for seat_id: {booking_request.seat_id}")
        
        # Step 1: Check if seat is already booked for this route
        seat_check_query = text("""
            SELECT t.ticket_id, t.seat_id, s.seat_number
            FROM tickets t
            JOIN seats s ON t.seat_id = s.seat_id
            JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
            WHERE br.route_id = :route_id AND t.seat_id = :seat_id AND t.journey_status = 'Booked'
        """)
        
        existing_booking = db.execute(seat_check_query, {
            "route_id": booking_request.bus_route_id,
            "seat_id": booking_request.seat_id
        }).fetchone()
        
        if existing_booking:
            logger.warning(f"Seat {existing_booking[2]} is already booked for this route")
            raise HTTPException(
                status_code=400, 
                detail=f"Seat {existing_booking[2]} is already booked. Please select another seat."
            )
        
        # Step 2: Check if seat exists and is available
        seat_query = text("SELECT seat_id, seat_number, status FROM seats WHERE seat_id = :seat_id")
        seat = db.execute(seat_query, {"seat_id": booking_request.seat_id}).fetchone()
        
        if not seat:
            logger.error(f"Seat {booking_request.seat_id} not found")
            raise HTTPException(status_code=404, detail="Seat not found")
        
        # Step 3: Create passenger
        passenger = models.Passenger(
            passenger_name=booking_request.passenger.passenger_name,
            contact_number=booking_request.passenger.contact_number,
            age=booking_request.passenger.age,
            gender=booking_request.passenger.gender,
            id_type=booking_request.passenger.id_type,
            id_number=booking_request.passenger.id_number
        )
        db.add(passenger)
        db.flush()  # Get passenger_id without committing
        
        # Step 4: Generate ticket number and QR code
        ticket_number = f"TKT-{datetime.now().strftime('%Y%m%d')}-{passenger.passenger_id}"
        qr_code_id = f"QR-{datetime.now().strftime('%Y-%m-%d')}-{passenger.passenger_id:03d}"
        
        # Step 5: Resolve bus_route_id
        resolved_bus_route_id = booking_request.bus_route_id
        bus_route_row = db.execute(
            text("SELECT bus_route_id FROM bus_routes WHERE route_id = :rid LIMIT 1"),
            {"rid": booking_request.bus_route_id}
        ).fetchone()
        if bus_route_row:
            resolved_bus_route_id = bus_route_row[0]
        else:
            logger.warning(f"No bus_route found for route_id={booking_request.bus_route_id}, using as-is")
        
        # Step 6: Create ticket
        ticket = models.Ticket(
            ticket_number=ticket_number,
            qr_code_id=qr_code_id,
            passenger_id=passenger.passenger_id,
            bus_route_id=resolved_bus_route_id,
            seat_id=booking_request.seat_id,
            conductor_id=booking_request.conductor_id,
            booking_date=date.today(),
            booking_time=datetime.now().time(),
            boarding_date=date.today(),
            journey_status="Booked",
            ticket_price=booking_request.ticket_price,
            qr_scan_status="Not Scanned"
        )
        db.add(ticket)
        db.flush()
        
        # Step 7: Update seat status to Booked
        update_seat_query = text("UPDATE seats SET status = 'Booked' WHERE seat_id = :seat_id")
        db.execute(update_seat_query, {"seat_id": booking_request.seat_id})
        
        # Step 8: Create payment
        payment_amount = payment_request.payment_amount if payment_request.payment_amount else booking_request.ticket_price
        transaction_id = f"TXN-{datetime.now().strftime('%Y-%m-%d')}-{ticket.ticket_id:03d}"
        
        payment = models.Payment(
            ticket_id=ticket.ticket_id,
            payment_amount=payment_amount,
            payment_method=normalize_payment_method(payment_request.payment_method),
            payment_status="Success",
            transaction_id=transaction_id,
            upi_id=payment_request.upi_id,
            payment_date=date.today(),
            payment_time=datetime.now().time(),
            conductor_id=booking_request.conductor_id
        )
        db.add(payment)
        
        # Step 9: Commit all changes
        db.commit()
        
        # Step 10: Return success response
        return {
            "success": True,
            "ticket": {
                "ticket_id": ticket.ticket_id,
                "ticket_number": ticket.ticket_number,
                "passenger_name": passenger.passenger_name,
                "seat_number": seat[1],
                "qr_code_id": qr_code_id
            },
            "payment": {
                "payment_id": payment.payment_id,
                "transaction_id": transaction_id,
                "payment_status": "Success",
                "payment_amount": payment_amount
            },
            "message": "Ticket booked successfully."
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Book ticket error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ticket booking failed: {str(e)}")

@app.get("/tickets/")
@app.get("/api/tickets/")
def get_tickets(db: Session = Depends(get_db)):
    """Get all tickets"""
    query = text("""
        SELECT 
            t.ticket_id,
            t.ticket_number,
            t.booking_date,
            t.booking_time,
            t.journey_status,
            t.ticket_price,
            p.passenger_name,
            p.contact_number,
            r.source_city,
            r.destination_city,
            s.seat_number,
            pay.payment_status,
            pay.payment_method
        FROM tickets t
        JOIN passengers p ON t.passenger_id = p.passenger_id
        JOIN bus_routes br ON t.bus_route_id = br.bus_route_id
        JOIN routes r ON br.route_id = r.route_id
        JOIN seats s ON t.seat_id = s.seat_id
        LEFT JOIN payments pay ON t.ticket_id = pay.ticket_id
        ORDER BY t.booking_date DESC, t.booking_time DESC
    """)
    
    result = db.execute(query)
    tickets = result.fetchall()
    
    return [
        {
            "id": ticket[0],
            "ticket_number": ticket[1],
            "booking_date": ticket[2],
            "booking_time": str(ticket[3]),
            "status": ticket[4],
            "amount": ticket[5],
            "passenger": ticket[6],
            "contact": ticket[7],
            "route": f"{ticket[8]} to {ticket[9]}",
            "seat": ticket[10],
            "payment_status": ticket[11] or "Pending",
            "payment_method": ticket[12] or "Cash"
        }
        for ticket in tickets
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
