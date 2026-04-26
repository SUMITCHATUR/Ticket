"""
Bus Ticket Booking System with Complete Payment Gateway
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, time, datetime, timedelta
import logging
import os
import socket

# Import existing modules
from app.database import get_db, test_connection
from app.services import TicketBookingService, QRCodeService, PaymentService
from app.validators import *
from app.simple_auth import get_current_active_user, check_admin_role, check_conductor_role, login_for_access_token, User, Token
from app.payment_system import PaymentGateway, PaymentProcessor, PaymentRequest, PaymentResponse, UPIPaymentRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Bus Ticket Booking System - Payment Gateway",
    description="Complete Bus Ticket Management System with Payment Processing & QR Codes",
    version="3.0.0",
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
        "message": "Bus Ticket Booking System with Payment Gateway",
        "version": "3.0.0",
        "features": [
            "Complete Payment Processing",
            "QR Code Generation",
            "UPI Integration",
            "Online Payment Gateway",
            "Cash Payment Support"
        ],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
def health_check():
    try:
        success, message = test_connection()
        return {
            "status": "healthy" if success else "unhealthy",
            "database": message,
            "payment_gateway": "active",
            "qr_generator": "active",
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
        return login_for_access_token(form_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@app.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# ===== PAYMENT GATEWAY ENDPOINTS =====

@app.post("/payment/create", response_model=PaymentResponse)
async def create_payment(
    payment_request: PaymentRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create payment and generate QR code"""
    try:
        logger.info(f"Creating payment: {payment_request.payment_method} - {payment_request.amount}")
        
        # Validate payment request
        if payment_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        if payment_request.payment_method.lower() not in ["cash", "upi", "online"]:
            raise HTTPException(status_code=400, detail="Invalid payment method")
        
        if payment_request.payment_method.lower() == "upi" and not payment_request.upi_id:
            raise HTTPException(status_code=400, detail="UPI ID is required for UPI payment")
        
        # Create payment
        payment_response = PaymentGateway.create_payment(payment_request)
        
        if payment_response.success:
            logger.info(f"Payment created successfully: {payment_response.payment_id}")
            return payment_response
        else:
            raise HTTPException(status_code=400, detail=payment_response.message)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create payment error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment creation failed")

@app.post("/payment/upi/generate-qr")
async def generate_upi_qr(
    upi_request: UPIPaymentRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Generate UPI payment QR code"""
    try:
        from app.payment_system import QRCodeGenerator
        
        logger.info(f"Generating UPI QR for: {upi_request.upi_id}")
        
        # Validate UPI request
        if upi_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        if not upi_request.upi_id:
            raise HTTPException(status_code=400, detail="UPI ID is required")
        
        # Generate QR code
        qr_data = QRCodeGenerator.generate_upi_qr(upi_request)
        
        # Generate UPI URL
        upi_url = f"upi://pay?pa={upi_request.upi_id}&pn={upi_request.merchant_name}&am={upi_request.amount}&cu=INR&tn={upi_request.transaction_note}"
        
        return {
            "success": True,
            "qr_code_data": qr_data,
            "upi_url": upi_url,
            "amount": upi_request.amount,
            "merchant_name": upi_request.merchant_name,
            "transaction_note": upi_request.transaction_note,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPI QR generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="UPI QR generation failed")

@app.post("/payment/verify/{payment_id}")
async def verify_payment(
    payment_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Verify payment status"""
    try:
        logger.info(f"Verifying payment: {payment_id}")
        
        verification = PaymentGateway.verify_payment(payment_id)
        
        if verification["success"]:
            logger.info(f"Payment verified: {payment_id}")
            return verification
        else:
            raise HTTPException(status_code=400, detail=verification.get("message", "Payment verification failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

@app.post("/payment/refund/{payment_id}")
async def process_refund(
    payment_id: str,
    amount: float,
    reason: str,
    current_user: User = Depends(check_admin_role)
):
    """Process payment refund (Admin only)"""
    try:
        logger.info(f"Processing refund: {payment_id} - {amount}")
        
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Refund amount must be positive")
        
        refund_result = PaymentGateway.process_refund(payment_id, amount, reason)
        
        if refund_result["success"]:
            logger.info(f"Refund processed: {refund_result['refund_id']}")
            return refund_result
        else:
            raise HTTPException(status_code=400, detail=refund_result.get("message", "Refund processing failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refund processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Refund processing failed")

# ===== TICKET PAYMENT INTEGRATION =====

@app.post("/tickets/book-with-payment")
async def book_ticket_with_payment(
    booking_request: TicketBookingRequest,
    payment_request: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    """Book ticket with integrated payment system"""
    try:
        logger.info(f"Booking ticket with payment: {payment_request.payment_method}")
        
        # Step 1: Create ticket booking
        booking_result = TicketBookingService.book_ticket(
            passenger_name=booking_request.passenger.passenger_name,
            contact_number=booking_request.passenger.contact_number,
            age=booking_request.passenger.age,
            gender=booking_request.passenger.gender,
            id_type=booking_request.passenger.id_type,
            id_number=booking_request.passenger.id_number,
            bus_route_id=booking_request.bus_route_id,
            seat_id=booking_request.seat_id,
            conductor_id=booking_request.conductor_id,
            payment_method=payment_request.payment_method,
            ticket_price=booking_request.ticket_price,
            db=db
        )
        
        if not booking_result["success"]:
            raise HTTPException(status_code=400, detail=booking_result["message"])
        
        # Step 2: Create payment for the ticket
        payment_processor = PaymentProcessor(db)
        
        payment_data = {
            "ticket_id": booking_result["ticket_id"],
            "amount": booking_request.ticket_price,
            "payment_method": payment_request.payment_method,
            "upi_id": payment_request.upi_id,
            "conductor_id": booking_request.conductor_id,
            "transaction_id": booking_result.get("qr_code_id", "")  # Use QR code ID as transaction ID
        }
        
        payment_result = payment_processor.create_ticket_payment(payment_data)
        
        if payment_result["success"]:
            logger.info(f"Ticket booked with payment: {booking_result['ticket_number']}")
            
            return {
                "success": True,
                "ticket": booking_result,
                "payment": payment_result,
                "message": "Ticket booked successfully. Please complete payment to confirm booking."
            }
        else:
            # If payment fails, we might want to rollback the ticket
            logger.error(f"Payment creation failed for ticket: {booking_result['ticket_id']}")
            raise HTTPException(status_code=400, detail="Payment processing failed")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Book ticket with payment error: {str(e)}")
        raise HTTPException(status_code=500, detail="Ticket booking with payment failed")

@app.post("/payment/complete/{payment_id}")
async def complete_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Complete payment after verification"""
    try:
        logger.info(f"Completing payment: {payment_id}")
        
        payment_processor = PaymentProcessor(db)
        completion_result = payment_processor.verify_and_complete_payment(payment_id)
        
        if completion_result["success"]:
            logger.info(f"Payment completed: {payment_id}")
            return completion_result
        else:
            raise HTTPException(status_code=400, detail=completion_result.get("message", "Payment completion failed"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment completion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment completion failed")

@app.get("/payment/history/{ticket_id}")
async def get_payment_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get payment history for a ticket"""
    try:
        logger.info(f"Getting payment history for ticket: {ticket_id}")
        
        payment_processor = PaymentProcessor(db)
        history = payment_processor.get_payment_history(ticket_id)
        
        return {
            "success": True,
            "ticket_id": ticket_id,
            "payment_history": history,
            "total_payments": len(history)
        }
        
    except Exception as e:
        logger.error(f"Get payment history error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get payment history")

# ===== EXISTING ENDPOINTS (Conductors, Routes, etc.) =====

@app.post("/conductors/")
async def create_conductor(
    conductor: ConductorBase, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_role)
):
    try:
        from app import models
        
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

@app.get("/buses/")
async def get_buses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
                "status": b.status
            }
            for b in buses
        ]
    except Exception as e:
        logger.error(f"Get buses error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get buses")

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

@app.get("/tickets/")
async def get_tickets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        from app import models
        tickets = db.query(models.Ticket).offset(skip).limit(limit).all()
        return [
            {
                "ticket_id": t.ticket_id,
                "ticket_number": t.ticket_number,
                "passenger_id": t.passenger_id,
                "booking_date": str(t.booking_date),
                "journey_status": t.journey_status,
                "ticket_price": float(t.ticket_price),
                "qr_scan_status": t.qr_scan_status
            }
            for t in tickets
        ]
    except Exception as e:
        logger.error(f"Get tickets error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get tickets")

@app.get("/payments/summary")
async def get_payment_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        summary = PaymentService.get_payment_summary(db)
        return [
            {
                "payment_method": row[0],
                "total_transactions": row[1],
                "total_amount": float(row[2]) if row[2] else 0,
                "average_amount": float(row[3]) if row[3] else 0,
                "successful": row[4],
                "failed": row[5],
                "pending": row[6]
            }
            for row in summary
        ]
    except Exception as e:
        logger.error(f"Get payment summary error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get payment summary")

@app.get("/revenue/by-route")
async def get_revenue_by_route_endpoint(
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
                "total_revenue": float(row[5]) if row[5] else 0,
                "average_fare": float(row[6]) if row[6] else 0
            }
            for row in revenue
        ]
    except Exception as e:
        logger.error(f"Get revenue by route error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get revenue by route")

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

# System info
@app.get("/system/info")
async def get_system_info(current_user: User = Depends(check_admin_role)):
    return {
        "system": "Bus Ticket Booking System with Payment Gateway",
        "version": "3.0.0",
        "environment": "production",
        "features": [
            "Authentication & Authorization",
            "Complete Payment Processing",
            "QR Code Generation",
            "UPI Integration",
            "Online Payment Gateway",
            "Cash Payment Support",
            "Refund Processing",
            "Payment History Tracking",
            "Input Validation & Error Handling",
            "Complete CRUD Operations",
            "Ticket Booking & QR Scanning",
            "Revenue Analytics"
        ],
        "payment_methods": ["Cash", "UPI", "Online"],
        "qr_types": ["Payment QR", "UPI QR", "Ticket QR"],
        "database": "PostgreSQL",
        "framework": "FastAPI",
        "status": "fully operational with payment gateway"
    }

if __name__ == "__main__":
    import uvicorn
    
    def find_free_port(start_port=8000):
        for port in range(start_port, 9000):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('localhost', port))
                    return port
            except OSError:
                continue
        return 8000
    
    port = find_free_port()
    print(f"Starting Bus Ticket System with Payment Gateway on port {port}")
    print(f"API: http://localhost:{port}")
    print(f"Docs: http://localhost:{port}/docs")
    print(f"Payment Gateway: Active")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
