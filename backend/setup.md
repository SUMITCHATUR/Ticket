# Bus Ticket Booking System - Backend Setup

## Quick Setup Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Update Database Configuration
Edit `.env` file with your PostgreSQL credentials:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/Ticket
```

### 3. Run the Application
```bash
python main.py
```

### 4. Access API Documentation
Open your browser and go to:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 5. Test Database Connection
Check health endpoint: http://localhost:8000/health

## Available Endpoints

### Conductors
- GET `/conductors/` - Get all conductors
- POST `/conductors/` - Create new conductor

### Buses
- GET `/buses/` - Get all buses
- POST `/buses/` - Create new bus

### Routes
- GET `/routes/` - Get all routes
- POST `/routes/` - Create new route

### Tickets
- GET `/tickets/` - Get all tickets
- POST `/tickets/` - Create new ticket
- GET `/routes/{route_id}/available-seats` - Get available seats for route

### Reports
- GET `/revenue-summary` - Get revenue summary by route

## Database Schema
The backend connects to your existing PostgreSQL database with tables:
- conductors
- buses
- routes
- bus_routes
- seats
- passengers
- tickets
- payments
- qr_codes

## Notes
- Make sure PostgreSQL is running on localhost:5432
- Database name should be "Ticket"
- All ENUM types are already created in the database
