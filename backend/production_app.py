from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time, datetime, timedelta
import logging
import os

# Import our modules
from app.database import get_db, test_connection
from app.services import TicketBookingService, QRCodeService, PaymentService
from app.validators import *
from app.simple_auth import get_current_active_user, check_conductor_role, login_for_access_token, User, Token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Bus Ticket Booking System - Production Ready",
    description="Complete Bus Ticket Management System with Authentication, Validation & Error Handling",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Custom exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    logger.error(f"ValueError: {str(exc)}")
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=str(exc)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {str(exc)}")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Internal server error"
    )

# Authentication endpoints
@app.post("/auth/login", response_model=Token)
async def login(form_data: dict):
    """Login endpoint to get access token"""
    try:
        return await login_for_access_token(form_data)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

@app.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user info"""
    return current_user

# Basic endpoints
@app.get("/")
def read_root():
    return {"message": "Bus Ticket Booking System API - Production Ready", "version": "2.0.0"}

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
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": f"Connection failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# ===== CONDUCTOR CRUD =====
@app.post("/conductors/", response_model=dict)
async def create_conductor(
    conductor: ConductorBase, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Create new conductor"""
    try:
        from app import models
        
        # Check if employee_id already exists
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

@app.get("/conductors/", response_model=List[dict])
async def get_conductors(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all conductors with pagination"""
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
                "joining_date": str(c.joining_date),
                "created_at": str(c.created_at)
            }
            for c in conductors
        ]
    except Exception as e:
        logger.error(f"Get conductors error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get conductors")

@app.get("/conductors/{conductor_id}")
async def get_conductor(
    conductor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific conductor by ID"""
    try:
        from app import models
        
        conductor = db.query(models.Conductor).filter(models.Conductor.conductor_id == conductor_id).first()
        if not conductor:
            raise HTTPException(status_code=404, detail="Conductor not found")
        
        return {
            "conductor_id": conductor.conductor_id,
            "conductor_name": conductor.conductor_name,
            "employee_id": conductor.employee_id,
            "contact_number": conductor.contact_number,
            "email": conductor.email,
            "status": conductor.status,
            "joining_date": str(conductor.joining_date),
            "created_at": str(conductor.created_at)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get conductor error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get conductor")

@app.put("/conductors/{conductor_id}")
async def update_conductor(
    conductor_id: int,
    conductor: ConductorBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Update conductor"""
    try:
        from app import models
        
        db_conductor = db.query(models.Conductor).filter(models.Conductor.conductor_id == conductor_id).first()
        if not db_conductor:
            raise HTTPException(status_code=404, detail="Conductor not found")
        
        for key, value in conductor.dict().items():
            setattr(db_conductor, key, value)
        
        db.commit()
        logger.info(f"Updated conductor: {conductor_id}")
        return {"message": "Conductor updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update conductor error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update conductor")

@app.delete("/conductors/{conductor_id}")
async def delete_conductor(
    conductor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Delete conductor"""
    try:
        from app import models
        
        db_conductor = db.query(models.Conductor).filter(models.Conductor.conductor_id == conductor_id).first()
        if not db_conductor:
            raise HTTPException(status_code=404, detail="Conductor not found")
        
        db.delete(db_conductor)
        db.commit()
        logger.info(f"Deleted conductor: {conductor_id}")
        return {"message": "Conductor deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete conductor error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete conductor")

# ===== BUS CRUD =====
@app.post("/buses/", response_model=dict)
async def create_bus(
    bus: BusBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Create new bus"""
    try:
        from app import models
        
        # Check if bus number already exists
        existing = db.query(models.Bus).filter(models.Bus.bus_number == bus.bus_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bus number already exists")
        
        db_bus = models.Bus(**bus.dict())
        db.add(db_bus)
        db.commit()
        db.refresh(db_bus)
        
        logger.info(f"Created bus: {bus.bus_number}")
        return {"message": "Bus created successfully", "bus_id": db_bus.bus_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create bus error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create bus")

@app.get("/buses/", response_model=List[dict])
async def get_buses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all buses with pagination"""
    try:
        from app import models
        
        buses = db.query(models.Bus).offset(skip).limit(limit).all()
        return [
            {
                "bus_id": b.bus_id,
                "bus_number": b.bus_number,
                "bus_name": b.bus_name,
                "bus_type": b.bus_type,
                "total_seats": b.total_seats,
                "available_seats": b.available_seats,
                "conductor_id": b.conductor_id,
                "registration_date": str(b.registration_date),
                "status": b.status,
                "created_at": str(b.created_at)
            }
            for b in buses
        ]
    except Exception as e:
        logger.error(f"Get buses error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get buses")

# ===== ROUTE CRUD =====
@app.post("/routes/", response_model=dict)
async def create_route(
    route: RouteBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Create new route"""
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

@app.get("/routes/", response_model=List[dict])
async def get_routes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all routes with pagination"""
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
                r.status,
                br.available_capacity,
                br.total_capacity
            FROM routes r
            LEFT JOIN bus_routes br ON r.route_id = br.route_id
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
                "status": row[9],
                "available_capacity": row[10] or 0,
                "total_capacity": row[11] or 0,
                "occupancy_percentage": round(((row[11] or 0) - (row[10] or 0)) / (row[11] or 1) * 100, 2)
            }
            for row in result.fetchall()
        ]
    except Exception as e:
        logger.error(f"Get routes error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get routes")

# ===== TICKET BOOKING =====
@app.get("/routes/{route_id}/available-seats")
async def get_available_seats(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get available seats for a specific route"""
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
    """Book a new ticket (Conductor or Admin)"""
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

# ===== QR CODE SCANNING =====
@app.post("/qr/scan")
async def scan_qr_code(
    scan_request: QRScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Scan QR code (Conductor or Admin)"""
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

# ===== PAYMENTS & REPORTS =====
@app.get("/payments/summary")
async def get_payment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get payment summary by method"""
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
    """Get revenue summary by route"""
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

# ===== TICKETS CRUD =====
@app.get("/tickets/", response_model=List[dict])
async def get_tickets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all tickets with pagination"""
    try:
        from app import models
        
        tickets = db.query(models.Ticket).offset(skip).limit(limit).all()
        return [
            {
                "ticket_id": t.ticket_id,
                "ticket_number": t.ticket_number,
                "qr_code_id": t.qr_code_id,
                "passenger_id": t.passenger_id,
                "bus_route_id": t.bus_route_id,
                "seat_id": t.seat_id,
                "conductor_id": t.conductor_id,
                "booking_date": str(t.booking_date),
                "booking_time": str(t.booking_time),
                "boarding_date": str(t.boarding_date),
                "journey_status": t.journey_status,
                "ticket_price": float(t.ticket_price),
                "qr_scan_status": t.qr_scan_status,
                "qr_scanned_at": str(t.qr_scanned_at) if t.qr_scanned_at else None,
                "created_at": str(t.created_at)
            }
            for t in tickets
        ]
    except Exception as e:
        logger.error(f"Get tickets error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get tickets")

# System info endpoint
@app.get("/system/info")
async def get_system_info(current_user: User = Depends(check_conductor_role)):
    """Get system information (Admin only)"""
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
            "Revenue Analytics",
            "Logging & Monitoring"
        ],
        "endpoints_count": 20,
        "database": "PostgreSQL",
        "framework": "FastAPI"
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Bus Ticket Booking System - Production Ready")
    uvicorn.run(app, host="0.0.0.0", port=9000, log_level="info")
