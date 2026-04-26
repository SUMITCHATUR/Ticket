from sqlalchemy import Column, Integer, String, Date, Time, Numeric, TIMESTAMP, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# ENUM types are already created in PostgreSQL, so we'll use String with constraints
class Conductor(Base):
    __tablename__ = "conductors"
    
    conductor_id = Column(Integer, primary_key=True, index=True)
    conductor_name = Column(String(100), nullable=False)
    employee_id = Column(String(20), unique=True, nullable=False)
    contact_number = Column(String(10), nullable=False)
    email = Column(String(100))
    joining_date = Column(Date, nullable=False)
    status = Column(String(20), default="Active")
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    buses = relationship("Bus", back_populates="conductor")
    tickets_issued = relationship("Ticket", back_populates="conductor")
    payments_received = relationship("Payment", back_populates="conductor_payment")
    qr_scanned = relationship("QRCode", back_populates="scanned_by_conductor")

class Bus(Base):
    __tablename__ = "buses"
    
    bus_id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(20), unique=True, nullable=False)
    bus_name = Column(String(100), nullable=False)
    bus_type = Column(String(20), nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    conductor_id = Column(Integer, ForeignKey("conductors.conductor_id"), nullable=True)
    registration_date = Column(Date, nullable=False)
    status = Column(String(20), default="Active")
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    conductor = relationship("Conductor", back_populates="buses")
    seats = relationship("Seat", back_populates="bus")
    bus_routes = relationship("BusRoute", back_populates="bus")

class Route(Base):
    __tablename__ = "routes"
    
    route_id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(100), nullable=False)
    source_city = Column(String(50), nullable=False)
    destination_city = Column(String(50), nullable=False)
    distance_km = Column(Numeric(6, 2), nullable=False)
    estimated_time_hours = Column(Numeric(5, 2), nullable=False)
    base_fare = Column(Numeric(8, 2), nullable=False)
    travel_date = Column(Date, nullable=False)
    departure_time = Column(Time, nullable=False)
    arrival_time = Column(Time, nullable=False)
    status = Column(String(20), default="Scheduled")
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    bus_routes = relationship("BusRoute", back_populates="route")

class BusRoute(Base):
    __tablename__ = "bus_routes"
    
    bus_route_id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.bus_id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.route_id"), nullable=False)
    available_capacity = Column(Integer, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    bus = relationship("Bus", back_populates="bus_routes")
    route = relationship("Route", back_populates="bus_routes")
    tickets = relationship("Ticket", back_populates="bus_route")

class Seat(Base):
    __tablename__ = "seats"
    
    seat_id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.bus_id"), nullable=False)
    seat_number = Column(String(10), nullable=False)
    seat_type = Column(String(20), nullable=False)
    status = Column(String(20), default="Available")
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    bus = relationship("Bus", back_populates="seats")
    tickets = relationship("Ticket", back_populates="seat")

class Passenger(Base):
    __tablename__ = "passengers"
    
    passenger_id = Column(Integer, primary_key=True, index=True)
    passenger_name = Column(String(100), nullable=False)
    contact_number = Column(String(10), nullable=False)
    age = Column(Integer)
    gender = Column(String(10))
    id_type = Column(String(20), nullable=False)
    id_number = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    tickets = relationship("Ticket", back_populates="passenger")

class Ticket(Base):
    __tablename__ = "tickets"
    
    ticket_id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False)
    qr_code_id = Column(String(100), unique=True, nullable=False)
    passenger_id = Column(Integer, ForeignKey("passengers.passenger_id"), nullable=False)
    bus_route_id = Column(Integer, ForeignKey("bus_routes.bus_route_id"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.seat_id"), nullable=False)
    conductor_id = Column(Integer, ForeignKey("conductors.conductor_id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    boarding_date = Column(Date, nullable=False)
    journey_status = Column(String(20), default="Booked")
    ticket_price = Column(Numeric(8, 2), nullable=False)
    qr_scan_status = Column(String(20), default="Not Scanned")
    qr_scanned_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    passenger = relationship("Passenger", back_populates="tickets")
    bus_route = relationship("BusRoute", back_populates="tickets")
    seat = relationship("Seat", back_populates="tickets")
    conductor = relationship("Conductor", back_populates="tickets_issued")
    payment = relationship("Payment", back_populates="ticket")
    qr_code = relationship("QRCode", back_populates="ticket")

class Payment(Base):
    __tablename__ = "payments"
    
    payment_id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id"), unique=True, nullable=False)
    payment_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(20), nullable=False)
    payment_status = Column(String(20), default="Pending")
    transaction_id = Column(String(50), unique=True)
    upi_id = Column(String(50))
    bank_name = Column(String(100))
    payment_date = Column(Date, nullable=False)
    payment_time = Column(Time, nullable=False)
    payment_received_by = Column(Integer, ForeignKey("conductors.conductor_id"), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    ticket = relationship("Ticket", back_populates="payment")
    conductor_payment = relationship("Conductor", back_populates="payments_received")

class QRCode(Base):
    __tablename__ = "qr_codes"
    
    qr_id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id"), nullable=False)
    qr_code_id = Column(String(100), unique=True, nullable=False)
    qr_data = Column(Text, nullable=False)
    qr_generated_at = Column(TIMESTAMP, server_default=func.now())
    qr_validity_status = Column(String(20), default="Valid")
    scan_count = Column(Integer, default=0)
    last_scanned_at = Column(TIMESTAMP)
    last_scanned_by = Column(Integer, ForeignKey("conductors.conductor_id"))
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    ticket = relationship("Ticket", back_populates="qr_code")
    scanned_by_conductor = relationship("Conductor", back_populates="qr_scanned")
