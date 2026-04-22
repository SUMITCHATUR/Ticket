from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime, date
from . import models

class TicketBookingService:
    
    @staticmethod
    def get_available_seats(route_id: int, db: Session):
        """Get available seats for a specific route"""
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
                r.base_fare
            FROM seats s
            JOIN buses b ON s.bus_id = b.bus_id
            JOIN bus_routes br ON b.bus_id = br.bus_id
            JOIN routes r ON br.route_id = r.route_id
            WHERE r.route_id = :route_id AND s.status = 'Available'
            ORDER BY s.seat_number
        """)
        
        result = db.execute(query, {"route_id": route_id})
        return result.fetchall()
    
    @staticmethod
    def book_ticket(
        passenger_name: str,
        contact_number: str,
        age: int,
        gender: str,
        id_type: str,
        id_number: str,
        bus_route_id: int,
        seat_id: int,
        conductor_id: int,
        payment_method: str,
        ticket_price: float,
        db: Session
    ):
        """Complete ticket booking process"""
        try:
            # 1. Create passenger
            passenger = models.Passenger(
                passenger_name=passenger_name,
                contact_number=contact_number,
                age=age,
                gender=gender,
                id_type=id_type,
                id_number=id_number
            )
            db.add(passenger)
            db.flush()  # Get passenger_id without committing
            
            # 2. Generate ticket number and QR code
            ticket_number = f"TKT-{datetime.now().strftime('%Y%m%d')}-{passenger.passenger_id}"
            qr_code_id = f"QR-{datetime.now().strftime('%Y-%m-%d')}-{passenger.passenger_id:03d}"
            
            # 3. Create ticket
            ticket = models.Ticket(
                ticket_number=ticket_number,
                qr_code_id=qr_code_id,
                passenger_id=passenger.passenger_id,
                bus_route_id=bus_route_id,
                seat_id=seat_id,
                conductor_id=conductor_id,
                booking_date=date.today(),
                booking_time=datetime.now().time(),
                boarding_date=date.today(),
                journey_status="Booked",
                ticket_price=ticket_price,
                qr_scan_status="Not Scanned"
            )
            db.add(ticket)
            db.flush()
            
            # 4. Update seat status
            seat = db.query(models.Seat).filter(models.Seat.seat_id == seat_id).first()
            if seat:
                seat.status = "Booked"
            
            # 5. Create payment
            transaction_id = f"TXN-{datetime.now().strftime('%Y-%m-%d')}-{ticket.ticket_id:03d}"
            payment = models.Payment(
                ticket_id=ticket.ticket_id,
                payment_amount=ticket_price,
                payment_method=payment_method,
                payment_status="Success",
                transaction_id=transaction_id,
                payment_date=date.today(),
                payment_time=datetime.now().time(),
                payment_received_by=conductor_id
            )
            db.add(payment)
            
            # 6. Create QR code
            qr_data = f'{{"ticket_id":"{ticket_number}","passenger":"{passenger_name}","status":"valid"}}'
            qr_code = models.QRCode(
                ticket_id=ticket.ticket_id,
                qr_code_id=qr_code_id,
                qr_data=qr_data,
                qr_validity_status="Valid"
            )
            db.add(qr_code)
            
            # 7. Update available seats in bus_routes
            bus_route = db.query(models.BusRoute).filter(models.BusRoute.bus_route_id == bus_route_id).first()
            if bus_route and bus_route.available_capacity > 0:
                bus_route.available_capacity -= 1
            
            # 8. Update available seats in buses
            seat_info = db.query(models.Seat).filter(models.Seat.seat_id == seat_id).first()
            if seat_info:
                bus = db.query(models.Bus).filter(models.Bus.bus_id == seat_info.bus_id).first()
                if bus and bus.available_seats > 0:
                    bus.available_seats -= 1
            
            db.commit()
            
            return {
                "success": True,
                "ticket_id": ticket.ticket_id,
                "ticket_number": ticket_number,
                "qr_code_id": qr_code_id,
                "passenger_name": passenger_name,
                "seat_number": seat.seat_number if seat else "Unknown",
                "message": "Ticket booked successfully"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to book ticket"
            }

class QRCodeService:
    
    @staticmethod
    def scan_qr_code(qr_code_id: str, conductor_id: int, db: Session):
        """Scan QR code and update status"""
        try:
            # Get QR code and check if valid
            qr_code = db.query(models.QRCode).filter(
                models.QRCode.qr_code_id == qr_code_id,
                models.QRCode.qr_validity_status == "Valid"
            ).first()
            
            if not qr_code:
                return {
                    "success": False,
                    "message": "Invalid QR Code"
                }
            
            # Update QR code scan information
            qr_code.scan_count += 1
            qr_code.last_scanned_at = datetime.now()
            qr_code.last_scanned_by = conductor_id
            qr_code.qr_validity_status = "Used"
            
            # Update ticket status
            ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == qr_code.ticket_id).first()
            if ticket:
                ticket.qr_scan_status = "Scanned"
                ticket.qr_scanned_at = datetime.now()
                ticket.journey_status = "Checked-In"
            
            db.commit()
            
            # Get passenger details
            passenger = db.query(models.Passenger).filter(models.Passenger.passenger_id == ticket.passenger_id).first()
            
            return {
                "success": True,
                "message": "QR Code scanned successfully",
                "passenger_name": passenger.passenger_name if passenger else "Unknown",
                "ticket_number": ticket.ticket_number,
                "scan_count": qr_code.scan_count
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to scan QR code"
            }

class PaymentService:
    
    @staticmethod
    def get_payment_summary(db: Session):
        """Get payment summary by method"""
        query = text("""
            SELECT 
                pay.payment_method,
                COUNT(t.ticket_id) AS total_transactions,
                SUM(pay.payment_amount) AS total_amount,
                AVG(pay.payment_amount) AS average_amount,
                COUNT(CASE WHEN pay.payment_status = 'Success' THEN 1 END) AS successful,
                COUNT(CASE WHEN pay.payment_status = 'Failed' THEN 1 END) AS failed,
                COUNT(CASE WHEN pay.payment_status = 'Pending' THEN 1 END) AS pending
            FROM payments pay
            JOIN tickets t ON pay.ticket_id = t.ticket_id
            GROUP BY pay.payment_method
            ORDER BY total_amount DESC
        """)
        
        result = db.execute(query)
        return result.fetchall()
    
    @staticmethod
    def get_revenue_by_route(db: Session):
        """Get revenue summary by route"""
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
        return result.fetchall()
