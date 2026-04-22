<<<<<<< HEAD
# Bus Ticket Booking System

A complete bus ticket management system with payment processing and QR code scanning capabilities.

## Features

- **Authentication & Authorization**: Role-based access control (Admin/Conductor)
- **Ticket Booking**: Complete ticket booking workflow with seat management
- **QR Code Scanning**: Digital ticket verification system
- **Payment Processing**: Multiple payment methods (Cash, UPI, Online)
- **Revenue Analytics**: Comprehensive reporting and analytics
- **Input Validation**: Robust data validation and error handling

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: Token-based authentication
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

## Project Structure

```
Ticket/
|
+-- backend/
|   |
|   +-- app/
|   |   |
|   |   +-- __init__.py
|   |   +-- database.py      # Database configuration
|   |   +-- models.py        # SQLAlchemy models
|   |   +-- services.py      # Business logic services
|   |   +-- validators.py     # Input validation models
|   |   +-- simple_auth.py   # Authentication system
|   |
|   +-- stable_app.py        # Main FastAPI application
|   +-- debug_server.py      # Debug utilities
|   +-- start_server.py      # Smart startup script
|   +-- requirements.txt     # Python dependencies
|   +-- .env                # Environment variables
|
+-- Ticket/                  # Frontend (to be added)
|
+-- README.md
+-- .gitignore
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ticket
   ```

2. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Database Setup**
   - Create PostgreSQL database named "Ticket"
   - Run the SQL script: `bus_ticket_system_postgresql.sql`
   - Update database credentials in `.env` file

4. **Environment Configuration**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/Ticket
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ```

5. **Start the server**
   ```bash
   python stable_app.py
   ```

The server will automatically find an available port and start.

## API Documentation

Once the server is running:

- **API Root**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Authentication

### Default Credentials

- **Admin**: username=`admin`, password=`admin123`
- **Conductor**: username=`conductor`, password=`conductor123`

### Getting Access Token

```bash
curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login and get access token
- `GET /auth/me` - Get current user information

### Conductors
- `POST /conductors/` - Create new conductor (Admin only)
- `GET /conductors/` - Get all conductors

### Routes
- `POST /routes/` - Create new route (Admin only)
- `GET /routes/` - Get all routes
- `GET /routes/{route_id}/available-seats` - Get available seats for route

### Tickets
- `POST /tickets/book` - Book a new ticket
- `GET /tickets/` - Get all tickets

### QR Codes
- `POST /qr/scan` - Scan QR code

### Reports
- `GET /payments/summary` - Get payment summary by method
- `GET /revenue/by-route` - Get revenue summary by route

### System
- `GET /health` - System health check
- `GET /system/info` - System information (Admin only)

## Database Schema

The system uses the following main tables:

- **conductors** - Conductor/staff information
- **buses** - Bus information and capacity
- **routes** - Route information
- **bus_routes** - Bus-route junction table
- **seats** - Seat information
- **passengers** - Passenger information
- **tickets** - Ticket information
- **payments** - Payment information
- **qr_codes** - QR code verification

## Features in Detail

### Ticket Booking Workflow

1. **Passenger Registration**: Automatically creates passenger records
2. **Seat Selection**: Real-time seat availability checking
3. **Payment Processing**: Multiple payment methods support
4. **QR Code Generation**: Automatic QR code generation for each ticket
5. **Ticket Confirmation**: Complete booking confirmation

### QR Code Scanning

- **Validation**: QR code validity checking
- **Scan Tracking**: Track scan history and count
- **Status Updates**: Automatic status updates upon scanning
- **Audit Trail**: Complete scan history for compliance

### Revenue Analytics

- **Payment Methods**: Breakdown by payment methods
- **Route Performance**: Revenue analysis by routes
- **Conductor Performance**: Individual conductor metrics
- **Time-based Reports**: Daily, weekly, monthly analytics

## Development

### Running Tests

```bash
python debug_server.py
```

### Starting Server

```bash
python stable_app.py
```

The server will automatically:
1. Find an available port
2. Start the FastAPI application
3. Display access URLs

## Security Features

- **Token-based Authentication**: Secure JWT tokens
- **Role-based Access**: Admin and Conductor roles
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Proper error responses
- **Logging**: Complete activity logging

## Production Deployment

For production deployment:

1. **Environment Variables**: Set production environment variables
2. **Database**: Use production PostgreSQL instance
3. **Security**: Update secret keys and passwords
4. **Monitoring**: Set up logging and monitoring
5. **HTTPS**: Configure SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.

---

**Note**: This is a college mini project demonstrating full-stack development capabilities with modern web technologies.
=======
# Ticket
>>>>>>> 9e9d4e6158ebc4197775fb4d02d887b1920b0557
