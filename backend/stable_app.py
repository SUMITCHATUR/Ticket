"""
Stable Bus Ticket Booking System - Production Ready
Fixed version without port conflicts and startup issues
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time, datetime, timedelta
import logging
import os
import socket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import modules
from app.database import get_db, test_connection
from app.services import TicketBookingService, QRCodeService, PaymentService
from app.validators import *
from app.simple_auth import get_current_active_user, check_admin_role, check_conductor_role, login_for_access_token, User, Token

# Create FastAPI app
app = FastAPI(
    title="Bus Ticket Booking System",
    description="Complete Bus Ticket Management System",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Basic endpoints
@app.get("/")
def read_root():
    return {
        "message": "Bus Ticket Booking System API",
        "version": "2.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
def health_check():
    try:
        success, message = test_connection()
        return {
            "status": "healthy" if success else "unhealthy",
            "database": message,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": f"Connection failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# Authentication
@app.post("/auth/login", response_model=Token)
async def login(form_data: dict):
    try:
        return await login_for_access_token(form_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Conductors CRUD
@app.post("/conductors/")
async def create_conductor(
    conductor: ConductorBase, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_role)
):
    try:
        from app import models
        
        # Check duplicate
        existing = db.query(models.Conductor).filter(models.Conductor.employee_id == conductor.employee_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Employee ID already exists")
        
        db_conductor = models.Conductor(**conductor.dict())
        db.add(db_conductor)
        db.commit()
        db.refresh(db_conductor)
        
        logger.info(f"Created conductor: {conductor.conductor_name}")
        return {"message": "Conductor created successfully", "conductor_id": db_conductor.conductor_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create conductor error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create conductor")

@app.get("/conductors/")
async def get_conductors(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        from app import models
        
        conductors = db.query(models.Conductor).offset(skip).limit(limit).all()
        return [
            {
                "conductor_id": c.conductor_id,
                "conductor_name": c.conductor_name,
                "employee_id": c.employee_id,
                "contact_number": c.contact_number,
                "email": c.email,
                "status": c.status,
                "joining_date": str(c.joining_date)
            }
            for c in conductors
        ]
    except Exception as e:
        logger.error(f"Get conductors error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get conductors")

# Routes
@app.get("/routes/")
async def get_routes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        query = text("""
            SELECT 
                r.route_id,
                r.route_name,
                r.source_city,
                r.destination_city,
                r.distance_km,
                r.base_fare,
                r.travel_date,
                r.departure_time,
                r.arrival_time,
                r.status
            FROM routes r
            ORDER BY r.travel_date, r.departure_time
            LIMIT :limit OFFSET :offset
        """)
        
        result = db.execute(query, {"limit": limit, "offset": skip})
        return [
            {
                "route_id": row[0],
                "route_name": row[1],
                "source_city": row[2],
                "destination_city": row[3],
                "distance_km": float(row[4]),
                "base_fare": float(row[5]),
                "travel_date": str(row[6]),
                "departure_time": str(row[7]),
                "arrival_time": str(row[8]),
                "status": row[9]
            }
            for row in result.fetchall()
        ]
    except Exception as e:
        logger.error(f"Get routes error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get routes")

@app.post("/routes/")
async def create_route(
    route: RouteBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_role)
):
    try:
        from app import models
        
        db_route = models.Route(**route.dict())
        db.add(db_route)
        db.commit()
        db.refresh(db_route)
        
        logger.info(f"Created route: {route.route_name}")
        return {"message": "Route created successfully", "route_id": db_route.route_id}
        
    except Exception as e:
        logger.error(f"Create route error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create route")

# Ticket Booking
@app.get("/routes/{route_id}/available-seats")
async def get_available_seats(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        if route_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid route ID")
        
        seats = TicketBookingService.get_available_seats(route_id, db)
        return [
            {
                "seat_id": seat[0],
                "seat_number": seat[1],
                "seat_type": seat[2],
                "bus_number": seat[3],
                "route_name": seat[4],
                "source_city": seat[5],
                "destination_city": seat[6],
                "departure_time": str(seat[7]),
                "base_fare": float(seat[8]) if seat[8] else 0
            }
            for seat in seats
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get available seats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get available seats")

@app.post("/tickets/book")
async def book_ticket(
    booking_request: TicketBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    try:
        result = TicketBookingService.book_ticket(
            passenger_name=booking_request.passenger.passenger_name,
            contact_number=booking_request.passenger.contact_number,
            age=booking_request.passenger.age,
            gender=booking_request.passenger.gender,
            id_type=booking_request.passenger.id_type,
            id_number=booking_request.passenger.id_number,
            bus_route_id=booking_request.bus_route_id,
            seat_id=booking_request.seat_id,
            conductor_id=booking_request.conductor_id,
            payment_method=booking_request.payment_method,
            ticket_price=booking_request.ticket_price,
            db=db
        )
        
        if result["success"]:
            logger.info(f"Ticket booked: {result['ticket_number']}")
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Book ticket error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to book ticket")

# QR Scanning
@app.post("/qr/scan")
async def scan_qr_code(
    scan_request: QRScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    try:
        result = QRCodeService.scan_qr_code(
            qr_code_id=scan_request.qr_code_id,
            conductor_id=scan_request.conductor_id,
            db=db
        )
        
        if result["success"]:
            logger.info(f"QR scanned: {scan_request.qr_code_id}")
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scan QR error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to scan QR code")

# Reports
@app.get("/payments/summary")
async def get_payment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        summary = PaymentService.get_payment_summary(db)
        return [
            {
                "payment_method": row[0],
                "total_transactions": row[1],
                "total_amount": float(row[2]),
                "average_amount": float(row[3]),
                "successful": row[4],
                "failed": row[5],
                "pending": row[6]
            }
            for row in summary
        ]
    except Exception as e:
        logger.error(f"Payment summary error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get payment summary")

@app.get("/revenue/by-route")
async def get_revenue_by_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        revenue = PaymentService.get_revenue_by_route(db)
        return [
            {
                "route_id": row[0],
                "route_name": row[1],
                "source_city": row[2],
                "destination_city": row[3],
                "total_tickets": row[4],
                "total_revenue": float(row[5]),
                "average_fare": float(row[6]) if row[6] else 0
            }
            for row in revenue
        ]
    except Exception as e:
        logger.error(f"Revenue report error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get revenue report")

# System info
@app.get("/system/info")
async def get_system_info(current_user: User = Depends(check_admin_role)):
    return {
        "system": "Bus Ticket Booking System",
        "version": "2.0.0",
        "environment": "production",
        "features": [
            "Authentication & Authorization",
            "Input Validation & Error Handling", 
            "Complete CRUD Operations",
            "Ticket Booking & QR Scanning",
            "Payment Processing",
            "Revenue Analytics"
        ],
        "database": "PostgreSQL",
        "framework": "FastAPI",
        "status": "fully operational"
    }

if __name__ == "__main__":
    import uvicorn
    
    def find_free_port(start_port=8000):
        """Find a free port"""
        for port in range(start_port, 9000):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('localhost', port))
                    return port
            except OSError:
                continue
        return 8000
    
    port = find_free_port()
    print(f"Starting Bus Ticket System on port {port}")
    print(f"API: http://localhost:{port}")
    print(f"Docs: http://localhost:{port}/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
