from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, test_connection
from app import models
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time

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

    model_config = {"from_attributes": True}

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

# Conductors endpoints
@app.get("/conductors/", response_model=List[Conductor])
def get_conductors(db: Session = Depends(get_db)):
    conductors = db.query(models.Conductor).all()
    return conductors

@app.post("/conductors/", response_model=Conductor)
def create_conductor(conductor: ConductorBase, db: Session = Depends(get_db)):
    db_conductor = models.Conductor(**conductor.dict())
    db.add(db_conductor)
    db.commit()
    db.refresh(db_conductor)
    return db_conductor

# Buses endpoints
@app.get("/buses/", response_model=List[Bus])
def get_buses(db: Session = Depends(get_db)):
    buses = db.query(models.Bus).all()
    return buses

@app.post("/buses/", response_model=Bus)
def create_bus(bus: BusBase, db: Session = Depends(get_db)):
    db_bus = models.Bus(**bus.dict())
    db.add(db_bus)
    db.commit()
    db.refresh(db_bus)
    return db_bus

# Routes endpoints
@app.get("/routes/", response_model=List[Route])
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(models.Route).all()
    return routes

@app.post("/routes/", response_model=Route)
def create_route(route: RouteBase, db: Session = Depends(get_db)):
    db_route = models.Route(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

# Tickets endpoints
@app.get("/tickets/", response_model=List[Ticket])
def get_tickets(db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).all()
    return tickets

@app.post("/tickets/", response_model=Ticket)
def create_ticket(ticket: TicketBase, db: Session = Depends(get_db)):
    db_ticket = models.Ticket(**ticket.dict())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

# Get available seats for a route
@app.get("/routes/{route_id}/available-seats")
def get_available_seats(route_id: int, db: Session = Depends(get_db)):
    query = """
    SELECT 
        s.seat_id,
        s.seat_number,
        s.seat_type,
        b.bus_number,
        r.route_name,
        r.source_city,
        r.destination_city,
        r.departure_time
    FROM seats s
    JOIN buses b ON s.bus_id = b.bus_id
    JOIN bus_routes br ON b.bus_id = br.bus_id
    JOIN routes r ON br.route_id = r.route_id
    WHERE r.route_id = :route_id AND s.status = 'Available'
    ORDER BY s.seat_number
    """
    
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
            "departure_time": str(seat[7])
        }
        for seat in seats
    ]

# Get revenue summary
@app.get("/revenue-summary")
def get_revenue_summary(db: Session = Depends(get_db)):
    query = """
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
    """
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
