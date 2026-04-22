from pydantic import BaseModel, validator, EmailStr
from typing import Optional
from datetime import date, time
from enum import Enum

# Enums for validation
class ConductorStatusEnum(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"

class BusTypeEnum(str, Enum):
    AC = "AC"
    NON_AC = "Non-AC"
    SLEEPER = "Sleeper"

class BusStatusEnum(str, Enum):
    ACTIVE = "Active"
    MAINTENANCE = "Maintenance"
    INACTIVE = "Inactive"

class SeatTypeEnum(str, Enum):
    WINDOW = "Window"
    AISLE = "Aisle"
    MIDDLE = "Middle"

class SeatStatusEnum(str, Enum):
    AVAILABLE = "Available"
    BOOKED = "Booked"
    RESERVED = "Reserved"

class RouteStatusEnum(str, Enum):
    SCHEDULED = "Scheduled"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"

class JourneyStatusEnum(str, Enum):
    BOOKED = "Booked"
    CHECKED_IN = "Checked-In"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class PaymentMethodEnum(str, Enum):
    CASH = "Cash"
    UPI = "UPI"
    ONLINE = "Online"

class PaymentStatusEnum(str, Enum):
    SUCCESS = "Success"
    PENDING = "Pending"
    FAILED = "Failed"
    REFUNDED = "Refunded"

class QRScanStatusEnum(str, Enum):
    NOT_SCANNED = "Not Scanned"
    SCANNED = "Scanned"
    INVALID = "Invalid"

class QRValidityEnum(str, Enum):
    VALID = "Valid"
    INVALID = "Invalid"
    EXPIRED = "Expired"
    USED = "Used"

class IDTypeEnum(str, Enum):
    AADHAR = "Aadhar"
    PAN = "PAN"
    PASSPORT = "Passport"
    DL = "DL"
    VOTER_ID = "Voter ID"

class GenderTypeEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

# Base validation models
class ConductorBase(BaseModel):
    conductor_name: str
    employee_id: str
    contact_number: str
    email: Optional[str] = None
    joining_date: date
    status: ConductorStatusEnum = ConductorStatusEnum.ACTIVE

    @validator('conductor_name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Conductor name must be at least 2 characters long')
        return v.strip()
    
    @validator('employee_id')
    def validate_employee_id(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Employee ID must be at least 3 characters long')
        return v.strip()
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        if not v or not v.isdigit() or len(v) != 10:
            raise ValueError('Contact number must be exactly 10 digits')
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v

class BusBase(BaseModel):
    bus_number: str
    bus_name: str
    bus_type: BusTypeEnum
    total_seats: int
    available_seats: int
    conductor_id: Optional[int] = None
    registration_date: date
    status: BusStatusEnum = BusStatusEnum.ACTIVE

    @validator('bus_number')
    def validate_bus_number(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Bus number must be at least 2 characters long')
        return v.strip()
    
    @validator('bus_name')
    def validate_bus_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Bus name must be at least 2 characters long')
        return v.strip()
    
    @validator('total_seats')
    def validate_total_seats(cls, v):
        if v <= 0 or v > 100:
            raise ValueError('Total seats must be between 1 and 100')
        return v
    
    @validator('available_seats')
    def validate_available_seats(cls, v, values):
        if 'total_seats' in values and v > values['total_seats']:
            raise ValueError('Available seats cannot exceed total seats')
        if v < 0:
            raise ValueError('Available seats cannot be negative')
        return v

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
    status: RouteStatusEnum = RouteStatusEnum.SCHEDULED

    @validator('route_name')
    def validate_route_name(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Route name must be at least 3 characters long')
        return v.strip()
    
    @validator('source_city', 'destination_city')
    def validate_cities(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('City name must be at least 2 characters long')
        return v.strip()
    
    @validator('distance_km')
    def validate_distance(cls, v):
        if v <= 0 or v > 5000:
            raise ValueError('Distance must be between 1 and 5000 km')
        return v
    
    @validator('estimated_time_hours')
    def validate_time(cls, v):
        if v <= 0 or v > 72:
            raise ValueError('Estimated time must be between 1 and 72 hours')
        return v
    
    @validator('base_fare')
    def validate_fare(cls, v):
        if v <= 0 or v > 10000:
            raise ValueError('Base fare must be between 1 and 10000')
        return v

class PassengerBase(BaseModel):
    passenger_name: str
    contact_number: str
    age: Optional[int] = None
    gender: Optional[GenderTypeEnum] = None
    id_type: IDTypeEnum
    id_number: str

    @validator('passenger_name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Passenger name must be at least 2 characters long')
        return v.strip()
    
    @validator('contact_number')
    def validate_contact_number(cls, v):
        if not v or not v.isdigit() or len(v) != 10:
            raise ValueError('Contact number must be exactly 10 digits')
        return v
    
    @validator('age')
    def validate_age(cls, v):
        if v is not None and (v < 1 or v > 120):
            raise ValueError('Age must be between 1 and 120')
        return v
    
    @validator('id_number')
    def validate_id_number(cls, v):
        if not v or len(v.strip()) < 5:
            raise ValueError('ID number must be at least 5 characters long')
        return v.strip()

class TicketBookingRequest(BaseModel):
    passenger: PassengerBase
    bus_route_id: int
    seat_id: int
    conductor_id: int
    payment_method: PaymentMethodEnum
    ticket_price: float

    @validator('bus_route_id', 'seat_id', 'conductor_id')
    def validate_positive_ids(cls, v):
        if v <= 0:
            raise ValueError('ID must be positive')
        return v
    
    @validator('ticket_price')
    def validate_ticket_price(cls, v):
        if v <= 0 or v > 10000:
            raise ValueError('Ticket price must be between 1 and 10000')
        return v

class QRScanRequest(BaseModel):
    qr_code_id: str
    conductor_id: int

    @validator('qr_code_id')
    def validate_qr_code_id(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('QR code ID must be at least 3 characters long')
        return v.strip()
    
    @validator('conductor_id')
    def validate_conductor_id(cls, v):
        if v <= 0:
            raise ValueError('Conductor ID must be positive')
        return v

class PaymentRequest(BaseModel):
    ticket_id: int
    payment_amount: float
    payment_method: PaymentMethodEnum
    transaction_id: Optional[str] = None
    upi_id: Optional[str] = None
    bank_name: Optional[str] = None

    @validator('ticket_id')
    def validate_ticket_id(cls, v):
        if v <= 0:
            raise ValueError('Ticket ID must be positive')
        return v
    
    @validator('payment_amount')
    def validate_payment_amount(cls, v):
        if v <= 0 or v > 10000:
            raise ValueError('Payment amount must be between 1 and 10000')
        return v
