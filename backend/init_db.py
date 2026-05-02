#!/usr/bin/env python3
"""
Database initialization script for Render deployment
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ticket.db")

def init_database():
    """Initialize database with tables and demo data"""
    try:
        print("Initializing database...")
        
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Import models
        from app import models
        
        # Create all tables
        models.Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if data exists
        conductor_count = db.query(models.Conductor).count()
        bus_count = db.query(models.Bus).count()
        
        if conductor_count == 0:
            # Create demo conductor
            demo_conductor = models.Conductor(
                conductor_name="Demo Conductor",
                employee_id="EMP001",
                contact_number="9876543210",
                email="conductor@busticket.com",
                joining_date="2024-01-01",
                status="Active"
            )
            db.add(demo_conductor)
            db.flush()
            print("✅ Demo conductor created")
            
            # Create demo bus
            demo_bus = models.Bus(
                bus_number="MH-01-AB-1234",
                bus_name="Express Bus",
                bus_type="AC Sleeper",
                total_seats=40,
                available_seats=40,
                conductor_id=demo_conductor.conductor_id,
                registration_date="2024-01-01",
                status="Active"
            )
            db.add(demo_bus)
            db.flush()
            print("✅ Demo bus created")
            
            # Create demo route
            demo_route = models.Route(
                route_name="Mumbai - Pune Express",
                source_city="Mumbai",
                destination_city="Pune",
                distance_km=150.0,
                estimated_time_hours=3.5,
                base_fare=500.0,
                travel_date="2024-12-25",
                departure_time="08:00:00",
                arrival_time="11:30:00",
                status="Scheduled"
            )
            db.add(demo_route)
            db.flush()
            print("✅ Demo route created")
            
            # Create bus-route relationship
            bus_route = models.BusRoute(
                bus_id=demo_bus.bus_id,
                route_id=demo_route.route_id,
                available_capacity=40,
                total_capacity=40
            )
            db.add(bus_route)
            print("✅ Bus-route relationship created")
            
            # Create demo seats
            for i in range(1, 41):  # 40 seats
                seat_type = "Sleeper" if i <= 20 else "Semi-Sleeper"
                seat = models.Seat(
                    bus_id=demo_bus.bus_id,
                    seat_number=f"A{i}" if i <= 20 else f"B{i-20}",
                    seat_type=seat_type,
                    status="Available"
                )
                db.add(seat)
            print("✅ Demo seats created")
            
            db.commit()
            print("✅ Database initialized successfully!")
            
        else:
            print(f"✅ Database already has data: {conductor_count} conductors, {bus_count} buses")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
