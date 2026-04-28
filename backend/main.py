from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, test_connection
from app import models
from app.payment_system import QRCodeGenerator, PaymentGateway, PaymentProcessor, PaymentResponse, UPIPaymentRequest
from app.validators import TicketBookingRequest, PaymentRequest as ValidatorPaymentRequest
from app.simple_auth import get_current_active_user, check_admin_role, check_conductor_role, login_for_access_token, User, Token
from app.services import TicketBookingService, PaymentService
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime, timedelta
import logging
import urllib.parse
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ConductorBase(BaseModel):
    conductor_name: str
    employee_id: str
    contact_number: str
    email: Optional[str] = None
    joining_date: date
    status: str = "Active"

class Conductor(ConductorBase):
    conductor_id: int
    created_at: str

    model_config = {"from_attributes": True}

class BusBase(BaseModel):
    bus_number: str
    bus_name: str
    bus_type: str
    total_seats: int
    available_seats: int
    conductor_id: Optional[int] = None
    registration_date: date
    status: str = "Active"

class Bus(BusBase):
    bus_id: int
    created_at: str

    model_config = {"from_attributes": True}

class RouteBase(BaseModel):
    route_name: str
    source_city: str
    destination_city: str
    distance_km: float
    estimated_time_hours: float
    base_fare: float
    travel_date: date
    departure_time: time
    arrival_time: time
    status: str = "Scheduled"

class Route(RouteBase):
    route_id: int
    created_at: str

    @classmethod
    def from_orm(cls, obj):
        return cls(
            route_id=obj.route_id,
            route_name=obj.route_name,
            source_city=obj.source_city,
            destination_city=obj.destination_city,
            distance_km=obj.distance_km,
            estimated_time_hours=obj.estimated_time_hours,
            base_fare=obj.base_fare,
            travel_date=obj.travel_date,
            departure_time=obj.departure_time,
            arrival_time=obj.arrival_time,
            status=obj.status,
            created_at=str(obj.created_at) if obj.created_at else ""
        )

    model_config = {"from_attributes": True}

class TicketBase(BaseModel):
    ticket_number: str
    qr_code_id: str
    passenger_id: int
    bus_route_id: int
    seat_id: int
    conductor_id: int
    booking_date: date
    booking_time: time
    boarding_date: date
    journey_status: str = "Booked"
    ticket_price: float
    qr_scan_status: str = "Not Scanned"

class Ticket(TicketBase):
    ticket_id: int
    qr_scanned_at: Optional[str] = None
    created_at: str

    @classmethod
    def from_orm(cls, obj):
        return cls(
            ticket_id=obj.ticket_id,
            ticket_number=obj.ticket_number,
            qr_code_id=obj.qr_code_id,
            passenger_id=obj.passenger_id,
            bus_route_id=obj.bus_route_id,
            seat_id=obj.seat_id,
            conductor_id=obj.conductor_id,
            booking_date=obj.booking_date,
            booking_time=obj.booking_time,
            boarding_date=obj.boarding_date,
            journey_status=obj.journey_status,
            ticket_price=obj.ticket_price,
            qr_scan_status=obj.qr_scan_status,
            qr_scanned_at=str(obj.qr_scanned_at) if obj.qr_scanned_at else None,
            created_at=str(obj.created_at) if obj.created_at else ""
        )

    model_config = {"from_attributes": True}

class QRRequest(BaseModel):
    payment_id: Optional[str] = None
    transaction_id: Optional[str] = None
    amount: float
    merchant_name: Optional[str] = "Bus Ticket System"
    type: Optional[str] = "payment"
    generated_at: Optional[str] = None
    expires_at: Optional[str] = None

class QRResponse(BaseModel):
    qr_code: str
    payment_id: Optional[str] = None
    expires_at: Optional[str] = None
    success: bool

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Bus Ticket Booking System API", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
@app.get("/api/health")
def health_check():
    success, message = test_connection()
    return {
        "status": "healthy" if success else "unhealthy",
        "database": message
    }

# Conductors endpoints
@app.get("/conductors/")
@app.get("/api/conductors/")
def get_conductors(db: Session = Depends(get_db)):
    conductors = db.query(models.Conductor).all()
    result = []
    for conductor in conductors:
        result.append({
            "conductor_id": conductor.conductor_id,
            "conductor_name": conductor.conductor_name,
            "employee_id": conductor.employee_id,
            "contact_number": conductor.contact_number,
            "email": conductor.email,
            "joining_date": str(conductor.joining_date),
            "status": conductor.status,
            "created_at": conductor.created_at.isoformat() if conductor.created_at else ""
        })
    return result

@app.post("/conductors/", response_model=Conductor)
@app.post("/api/conductors/", response_model=Conductor)
def create_conductor(conductor: ConductorBase, db: Session = Depends(get_db)):
    db_conductor = models.Conductor(**conductor.dict())
    db.add(db_conductor)
    db.commit()
    db.refresh(db_conductor)
    return db_conductor

# Buses endpoints
@app.get("/buses/")
@app.get("/api/buses/")
def get_buses(db: Session = Depends(get_db)):
    buses = db.query(models.Bus).all()
    result = []
    for bus in buses:
        result.append({
            "bus_id": bus.bus_id,
            "bus_number": bus.bus_number,
            "bus_name": bus.bus_name,
            "bus_type": bus.bus_type,
            "total_seats": bus.total_seats,
            "available_seats": bus.available_seats,
            "conductor_id": bus.conductor_id,
            "registration_date": str(bus.registration_date),
            "status": bus.status,
            "created_at": str(bus.created_at) if bus.created_at else ""
        })
    return result

@app.post("/buses/", response_model=Bus)
@app.post("/api/buses/", response_model=Bus)
def create_bus(bus: BusBase, db: Session = Depends(get_db)):
    db_bus = models.Bus(**bus.dict())
    db.add(db_bus)
    db.commit()
    db.refresh(db_bus)
    return db_bus

# Routes endpoints
@app.get("/routes/", response_model=List[Route])
@app.get("/api/routes/", response_model=List[Route])
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(models.Route).all()
    return [Route.from_orm(route) for route in routes]

@app.post("/routes/", response_model=Route)
@app.post("/api/routes/", response_model=Route)
def create_route(route: RouteBase, db: Session = Depends(get_db)):
    db_route = models.Route(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

# Tickets endpoints
@app.get("/tickets/")
@app.get("/api/tickets/")
def get_tickets(db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).all()
    result = []
    for ticket in tickets:
        # Get passenger name
        passenger = db.query(models.Passenger).filter(models.Passenger.passenger_id == ticket.passenger_id).first()
        passenger_name = passenger.passenger_name if passenger else "Unknown"
        
        # Get route info
        bus_route = db.query(models.BusRoute).filter(models.BusRoute.bus_route_id == ticket.bus_route_id).first()
        route = db.query(models.Route).filter(models.Route.route_id == bus_route.route_id).first() if bus_route else None
        route_name = route.route_name if route else "Unknown"
        
        # Get seat info
        seat = db.query(models.Seat).filter(models.Seat.seat_id == ticket.seat_id).first()
        seat_number = seat.seat_number if seat else "Unknown"
        
        # Get bus info
        bus = db.query(models.Bus).filter(models.Bus.bus_id == seat.bus_id).first() if seat else None
        bus_number = bus.bus_number if bus else "Unknown"
        
        # Get payment info
        payment = db.query(models.Payment).filter(models.Payment.ticket_id == ticket.ticket_id).first()
        payment_method = payment.payment_method if payment else "Unknown"
        
        result.append({
            "id": ticket.ticket_id,
            "ticket_number": ticket.ticket_number,
            "passenger_name": passenger_name,
            "route": route_name,
            "bus_number": bus_number,
            "seat_number": seat_number,
            "amount": float(ticket.ticket_price),
            "payment_method": payment_method,
            "status": ticket.journey_status,
            "booking_date": str(ticket.booking_date),
            "booking_time": str(ticket.booking_time),
            "journey_date": str(ticket.boarding_date),
            "departure_time": route.departure_time if route else "Unknown"
        })
    
    return result

@app.post("/tickets/", response_model=Ticket)
@app.post("/api/tickets/", response_model=Ticket)
def create_ticket(ticket: TicketBase, db: Session = Depends(get_db)):
    db_ticket = models.Ticket(**ticket.dict())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

# Get available seats for a route
@app.get("/routes/{route_id}/available-seats")
def get_available_seats(route_id: int, db: Session = Depends(get_db)):
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
        s.status
    FROM seats s
    JOIN buses b ON s.bus_id = b.bus_id
    JOIN bus_routes br ON b.bus_id = br.bus_id
    JOIN routes r ON br.route_id = r.route_id
    WHERE r.route_id = :route_id AND s.status = 'Available'
    ORDER BY s.seat_number
    """)
    
    result = db.execute(query, {"route_id": route_id})
    seats = result.fetchall()
    
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
            "status": seat[8].lower() if len(seat) > 8 and seat[8] else "available"
        }
        for seat in seats
    ]

# Get revenue summary
@app.get("/revenue-summary")
@app.get("/api/revenue-summary")
@app.get("/api/payments/summary")
def get_revenue_summary(db: Session = Depends(get_db)):
    query = text("""
    SELECT 
        r.route_id,
        r.route_name,
        r.source_city,
        r.destination_city,
        COUNT(t.ticket_id) AS total_tickets,
        SUM(pay.payment_amount) AS total_revenue,
        AVG(pay.payment_amount) AS average_fare
    FROM routes r
    JOIN bus_routes br ON r.route_id = br.route_id
    LEFT JOIN tickets t ON br.bus_route_id = t.bus_route_id
    LEFT JOIN payments pay ON t.ticket_id = pay.ticket_id
    WHERE pay.payment_status = 'Success'
    GROUP BY r.route_id, r.route_name, r.source_city, r.destination_city
    ORDER BY total_revenue DESC
    """)
    
    result = db.execute(query)
    revenue_data = result.fetchall()
    
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
        for row in revenue_data
    ]

@app.post("/auth/login")
@app.post("/api/auth/login")
async def login(form_data: dict):
    try:
        return login_for_access_token(form_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@app.get("/auth/me")
@app.get("/api/auth/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# ===== PAYMENT GATEWAY ENDPOINTS =====

@app.post("/payment/create")
@app.post("/api/payment/create")
async def create_payment(
    payment_request: ValidatorPaymentRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create payment and generate QR code"""
    try:
        logger.info(f"Creating payment: {payment_request.payment_method} - {payment_request.payment_amount}")
        
        # Create payment data for system
        from app.payment_system import PaymentRequest as SystemPaymentRequest
        sys_req = SystemPaymentRequest(
            ticket_id=payment_request.ticket_id,
            amount=payment_request.payment_amount,
            payment_method=payment_request.payment_method,
            upi_id=payment_request.upi_id,
            transaction_id=payment_request.transaction_id
        )
        
        # Create payment
        payment_response = PaymentGateway.create_payment(sys_req)
        
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
@app.post("/api/payment/upi/generate-qr")
async def generate_upi_qr(
    upi_request: UPIPaymentRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Generate UPI payment QR code"""
    try:
        logger.info(f"Generating UPI QR for: {upi_request.upi_id}")
        
        # Validate UPI request
        if upi_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        if not upi_request.upi_id:
            raise HTTPException(status_code=400, detail="UPI ID is required")
        
        # Logic for UPI QR generation
        # Ensure name and note are URL encoded for PhonePe/GPay compatibility
        encoded_name = urllib.parse.quote(upi_request.merchant_name or "Bus Ticket System")
        encoded_note = urllib.parse.quote(upi_request.transaction_note or "Booking Payment")
        formatted_amount = "{:.2f}".format(upi_request.amount)
        
        # Add transaction reference for better app compatibility
        txn_ref = f"BT{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Robust UPI URL format with tr (transaction ref) and mc (merchant code)
        upi_url = f"upi://pay?pa={upi_request.upi_id}&pn={encoded_name}&am={formatted_amount}&cu=INR&tn={encoded_note}&tr={txn_ref}&mc=0000&mode=02"
        
        # Generate QR code image with better error correction for easier scanning
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4
        )
        qr.add_data(upi_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "success": True,
            "qr_code_data": f"data:image/png;base64,{qr_base64}",
            "upi_url": upi_url,
            "amount": upi_request.amount,
            "merchant_name": upi_request.merchant_name,
            "transaction_note": upi_request.transaction_note,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"UPI QR generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="UPI QR generation failed")

@app.post("/payment/verify/{payment_id}")
@app.post("/api/payment/verify/{payment_id}")
async def verify_payment(
    payment_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Verify payment status"""
    try:
        logger.info(f"Verifying payment: {payment_id}")
        verification = PaymentGateway.verify_payment(payment_id)
        if verification["success"]:
            return verification
        else:
            raise HTTPException(status_code=400, detail=verification.get("message", "Payment verification failed"))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

class CombinedBookingRequest(BaseModel):
    booking_request: TicketBookingRequest
    payment_request: ValidatorPaymentRequest

@app.post("/tickets/book-with-payment")
@app.post("/api/tickets/book-with-payment")
async def book_ticket_with_payment(
    combined: CombinedBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_conductor_role)
):
    booking_request = combined.booking_request
    payment_request = combined.payment_request
    """Book ticket with integrated payment system"""
    try:
        logger.info(f"Booking ticket with payment: {payment_request.payment_method}")

        # Resolve bus_route_id: frontend sends route_id (routes table).
        # Look up the matching bus_route_id from bus_routes table.
        resolved_bus_route_id = booking_request.bus_route_id
        bus_route_row = db.execute(
            text("SELECT bus_route_id FROM bus_routes WHERE route_id = :rid LIMIT 1"),
            {"rid": booking_request.bus_route_id}
        ).fetchone()
        if bus_route_row:
            resolved_bus_route_id = bus_route_row[0]
        else:
            # If no bus_route exists yet, just use what was sent (will fail gracefully in service)
            logger.warning(f"No bus_route found for route_id={booking_request.bus_route_id}, using as-is")

        # payment_amount may not be set — use ticket_price as fallback
        pay_amount = payment_request.payment_amount if payment_request.payment_amount else booking_request.ticket_price

        # Step 1: Create ticket booking
        booking_result = TicketBookingService.book_ticket(
            passenger_name=booking_request.passenger.passenger_name,
            contact_number=booking_request.passenger.contact_number,
            age=booking_request.passenger.age,
            gender=booking_request.passenger.gender,
            id_type=booking_request.passenger.id_type,
            id_number=booking_request.passenger.id_number,
            bus_route_id=resolved_bus_route_id,
            seat_id=booking_request.seat_id,
            conductor_id=booking_request.conductor_id,
            payment_method=str(payment_request.payment_method),
            ticket_price=booking_request.ticket_price,
            db=db
        )

        if not booking_result["success"]:
            raise HTTPException(status_code=400, detail=booking_result.get("message", "Booking failed"))

        # Step 2: Create payment for the ticket
        payment_processor = PaymentProcessor(db)
        payment_data = {
            "ticket_id": booking_result["ticket_id"],
            "amount": pay_amount,
            "payment_method": str(payment_request.payment_method),
            "upi_id": payment_request.upi_id,
            "conductor_id": booking_request.conductor_id,
            "transaction_id": booking_result.get("qr_code_id", "")
        }

        payment_result = payment_processor.create_ticket_payment(payment_data)

        if payment_result["success"]:
            return {
                "success": True,
                "ticket": booking_result,
                "payment": payment_result,
                "message": "Ticket booked successfully."
            }
        else:
            error_msg = payment_result.get("error", "Unknown error")
            raise HTTPException(status_code=400, detail=f"Payment processing failed: {error_msg}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Book ticket error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ticket booking failed: {str(e)}")

@app.post("/payment/complete/{payment_id}")
@app.post("/api/payment/complete/{payment_id}")
async def complete_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Complete payment after verification"""
    try:
        payment_processor = PaymentProcessor(db)
        completion_result = payment_processor.verify_and_complete_payment(payment_id)
        if completion_result["success"]:
            return completion_result
        else:
            raise HTTPException(status_code=400, detail=completion_result.get("message", "Payment completion failed"))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment completion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment completion failed")

@app.get("/payment/history/{ticket_id}")
@app.get("/api/payment/history/{ticket_id}")
async def get_payment_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get payment history for a ticket"""
    try:
        payment_processor = PaymentProcessor(db)
        history = payment_processor.get_payment_history(ticket_id)
        return {
            "success": True,
            "ticket_id": ticket_id,
            "payment_history": history
        }
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get history")

# QR Code generation endpoint
@app.post("/generate-qr", response_model=QRResponse)
@app.post("/api/generate-qr", response_model=QRResponse)
def generate_qr_code(request: QRRequest):
    """Generate QR code for payment or ticket"""
    try:
        # Prepare payment data for QR generation
        payment_data = {
            "payment_id": request.payment_id,
            "transaction_id": request.transaction_id,
            "amount": request.amount,
            "merchant_name": request.merchant_name,
            "expires_at": request.expires_at
        }
        
        # Generate QR code using custom QR generator
        qr_code = QRCodeGenerator.generate_payment_qr(payment_data)
        
        return QRResponse(
            qr_code=qr_code,
            payment_id=request.payment_id,
            expires_at=request.expires_at,
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QR generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
