from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time
import uuid

from app.database import get_db, test_connection
from app.services import TicketBookingService, QRCodeService, PaymentService

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

# Pydantic models for booking
class PassengerInfo(BaseModel):
    passenger_name: str
    contact_number: str
    age: Optional[int] = None
    gender: Optional[str] = None
    id_type: str
    id_number: str

class TicketBookingRequest(BaseModel):
    passenger: PassengerInfo
    bus_route_id: int
    seat_id: int
    conductor_id: int
    payment_method: str
    ticket_price: float

class QRScanRequest(BaseModel):
    qr_code_id: str
    conductor_id: int

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Bus Ticket Booking System API", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
def health_check():
    success, message = test_connection()
    return {
        "status": "healthy" if success else "unhealthy",
        "database": message
    }

# Get available seats for a route
@app.get("/routes/{route_id}/available-seats")
def get_available_seats(route_id: int, db: Session = Depends(get_db)):
    try:
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
                "base_fare": float(seat[8])
            }
            for seat in seats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Book a new ticket
@app.post("/tickets/book")
def book_ticket(booking_request: TicketBookingRequest, db: Session = Depends(get_db)):
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
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Scan QR code
@app.post("/qr/scan")
def scan_qr_code(scan_request: QRScanRequest, db: Session = Depends(get_db)):
    try:
        result = QRCodeService.scan_qr_code(
            qr_code_id=scan_request.qr_code_id,
            conductor_id=scan_request.conductor_id,
            db=db
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get payment summary
@app.get("/payments/summary")
def get_payment_summary(db: Session = Depends(get_db)):
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
        raise HTTPException(status_code=500, detail=str(e))

# Get revenue by route
@app.get("/revenue/by-route")
def get_revenue_by_route(db: Session = Depends(get_db)):
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
        raise HTTPException(status_code=500, detail=str(e))

# Get all routes
@app.get("/routes/")
def get_routes(db: Session = Depends(get_db)):
    try:
        from app import models
        from sqlalchemy import text
        
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
            JOIN bus_routes br ON r.route_id = br.route_id
            WHERE r.status = 'Scheduled'
            ORDER BY r.travel_date, r.departure_time
        """)
        
        result = db.execute(query)
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
                "available_capacity": row[10],
                "total_capacity": row[11],
                "occupancy_percentage": round((row[11] - row[10]) / row[11] * 100, 2) if row[11] > 0 else 0
            }
            for row in result.fetchall()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get all conductors
@app.get("/conductors/")
def get_conductors(db: Session = Depends(get_db)):
    try:
        from app import models
        conductors = db.query(models.Conductor).all()
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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
