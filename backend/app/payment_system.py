"""
Complete Payment Gateway and QR Code System
"""

import qrcode
import io
import base64
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import hashlib

# Payment Gateway Models
class PaymentRequest(BaseModel):
    amount: float
    payment_method: str
    upi_id: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None

class PaymentResponse(BaseModel):
    success: bool
    payment_id: str
    transaction_id: str
    qr_code_data: Optional[str] = None
    payment_url: Optional[str] = None
    upi_url: Optional[str] = None
    message: str
    expires_at: Optional[str] = None

class UPIPaymentRequest(BaseModel):
    upi_id: str
    amount: float
    merchant_name: str
    transaction_note: str

class OnlinePaymentRequest(BaseModel):
    card_number: str
    expiry_month: str
    expiry_year: str
    cvv: str
    cardholder_name: str
    amount: float

class QRCodeGenerator:
    
    @staticmethod
    def generate_payment_qr(payment_data: Dict) -> str:
        """Generate QR code for payment"""
        try:
            # Create QR code data
            qr_data = {
                "payment_id": payment_data.get("payment_id"),
                "amount": payment_data.get("amount"),
                "merchant": payment_data.get("merchant_name", "Bus Ticket System"),
                "transaction_id": payment_data.get("transaction_id"),
                "timestamp": datetime.now().isoformat(),
                "expires_at": payment_data.get("expires_at")
            }
            
            # Convert to JSON string
            qr_string = json.dumps(qr_data, indent=2)
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_string)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            raise Exception(f"QR Code generation failed: {str(e)}")
    
    @staticmethod
    def generate_upi_qr(upi_data: UPIPaymentRequest) -> str:
        """Generate UPI QR code"""
        try:
            # UPI QR format: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT&cu=CURRENCY&tn=TRANSACTION_NOTE
            upi_url = f"upi://pay?pa={upi_data.upi_id}&pn={upi_data.merchant_name}&am={upi_data.amount}&cu=INR&tn={upi_data.transaction_note}"
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(upi_url)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            raise Exception(f"UPI QR Code generation failed: {str(e)}")

class PaymentGateway:
    
    @staticmethod
    def create_payment(request: PaymentRequest) -> PaymentResponse:
        """Create payment and generate QR code"""
        try:
            # Generate unique payment ID
            payment_id = f"PAY_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8].upper()}"
            transaction_id = f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:6].upper()}"
            
            # Set expiry time (15 minutes)
            expires_at = datetime.now() + timedelta(minutes=15)
            
            payment_data = {
                "payment_id": payment_id,
                "transaction_id": transaction_id,
                "amount": request.amount,
                "merchant_name": "Bus Ticket System",
                "expires_at": expires_at.isoformat()
            }
            
            # Generate QR code based on payment method
            qr_code_data = None
            payment_url = None
            upi_url = None
            
            if request.payment_method.lower() == "upi":
                if request.upi_id:
                    # Generate UPI QR
                    upi_request = UPIPaymentRequest(
                        upi_id=request.upi_id,
                        amount=request.amount,
                        merchant_name="Bus Ticket System",
                        transaction_note=f"Bus Ticket Payment - {payment_id}"
                    )
                    qr_code_data = QRCodeGenerator.generate_upi_qr(upi_request)
                    upi_url = f"upi://pay?pa={request.upi_id}&pn=Bus Ticket System&am={request.amount}&cu=INR&tn=Bus Ticket Payment - {payment_id}"
                else:
                    raise Exception("UPI ID is required for UPI payment")
                    
            elif request.payment_method.lower() == "online":
                # Generate payment URL for online payment
                payment_url = f"https://payment.bus-ticket.com/pay/{payment_id}"
                qr_code_data = QRCodeGenerator.generate_payment_qr(payment_data)
                
            elif request.payment_method.lower() == "cash":
                # For cash, generate receipt QR
                qr_code_data = QRCodeGenerator.generate_payment_qr(payment_data)
                
            else:
                raise Exception(f"Unsupported payment method: {request.payment_method}")
            
            return PaymentResponse(
                success=True,
                payment_id=payment_id,
                transaction_id=transaction_id,
                qr_code_data=qr_code_data,
                payment_url=payment_url,
                upi_url=upi_url,
                message="Payment initiated successfully",
                expires_at=expires_at.isoformat()
            )
            
        except Exception as e:
            return PaymentResponse(
                success=False,
                payment_id="",
                transaction_id="",
                message=f"Payment creation failed: {str(e)}"
            )
    
    @staticmethod
    def verify_payment(payment_id: str) -> Dict:
        """Verify payment status"""
        try:
            # In real implementation, this would check with payment gateway
            # For demo, we'll simulate payment verification
            
            # Simulate payment success (80% chance)
            import random
            payment_success = random.random() > 0.2
            
            return {
                "success": payment_success,
                "payment_id": payment_id,
                "status": "completed" if payment_success else "failed",
                "verified_at": datetime.now().isoformat(),
                "amount": None,  # Would fetch from database
                "transaction_id": None
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Payment verification failed"
            }
    
    @staticmethod
    def process_refund(payment_id: str, amount: float, reason: str) -> Dict:
        """Process payment refund"""
        try:
            refund_id = f"REF_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8].upper()}"
            
            return {
                "success": True,
                "refund_id": refund_id,
                "payment_id": payment_id,
                "amount": amount,
                "reason": reason,
                "processed_at": datetime.now().isoformat(),
                "status": "processed"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Refund processing failed"
            }

class PaymentProcessor:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_ticket_payment(self, ticket_data: Dict) -> Dict:
        """Create payment for ticket booking"""
        try:
            from app import models
            
            # Create payment record
            payment = models.Payment(
                ticket_id=ticket_data.get("ticket_id"),
                payment_amount=ticket_data.get("amount"),
                payment_method=ticket_data.get("payment_method"),
                payment_status="Pending",
                transaction_id=ticket_data.get("transaction_id"),
                upi_id=ticket_data.get("upi_id"),
                payment_date=datetime.now().date(),
                payment_time=datetime.now().time(),
                payment_received_by=ticket_data.get("conductor_id")
            )
            
            self.db.add(payment)
            self.db.flush()  # Get payment_id without committing
            
            # Generate QR code for payment
            payment_request = PaymentRequest(
                amount=ticket_data.get("amount"),
                payment_method=ticket_data.get("payment_method"),
                upi_id=ticket_data.get("upi_id"),
                description=f"Bus Ticket Payment - Ticket {ticket_data.get('ticket_id')}"
            )
            
            payment_response = PaymentGateway.create_payment(payment_request)
            
            if payment_response.success:
                # Update payment with gateway details
                payment.transaction_id = payment_response.transaction_id
                
                # Create QR code record
                qr_code = models.QRCode(
                    ticket_id=ticket_data.get("ticket_id"),
                    qr_code_id=payment_response.payment_id,
                    qr_data=json.dumps({
                        "payment_id": payment_response.payment_id,
                        "amount": ticket_data.get("amount"),
                        "method": ticket_data.get("payment_method"),
                        "created_at": datetime.now().isoformat()
                    }),
                    qr_validity_status="Valid"
                )
                
                self.db.add(qr_code)
                self.db.commit()
                
                return {
                    "success": True,
                    "payment_id": payment.payment_id,
                    "qr_code_data": payment_response.qr_code_data,
                    "payment_url": payment_response.payment_url,
                    "upi_url": payment_response.upi_url,
                    "expires_at": payment_response.expires_at,
                    "message": "Payment initiated successfully"
                }
            else:
                self.db.rollback()
                return {
                    "success": False,
                    "message": payment_response.message
                }
                
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": str(e),
                "message": "Payment processing failed"
            }
    
    def verify_and_complete_payment(self, payment_id: str) -> Dict:
        """Verify payment and update status"""
        try:
            from app import models
            
            # Verify with payment gateway
            verification = PaymentGateway.verify_payment(payment_id)
            
            if verification["success"]:
                # Update payment status
                payment = self.db.query(models.Payment).filter(
                    models.Payment.transaction_id == payment_id
                ).first()
                
                if payment:
                    payment.payment_status = "Success"
                    self.db.commit()
                    
                    return {
                        "success": True,
                        "message": "Payment verified and completed",
                        "payment_id": payment.payment_id,
                        "ticket_id": payment.ticket_id
                    }
                else:
                    return {
                        "success": False,
                        "message": "Payment record not found"
                    }
            else:
                return {
                    "success": False,
                    "message": "Payment verification failed"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Payment verification failed"
            }
    
    def get_payment_history(self, ticket_id: int) -> List[Dict]:
        """Get payment history for a ticket"""
        try:
            from app import models
            
            payments = self.db.query(models.Payment).filter(
                models.Payment.ticket_id == ticket_id
            ).all()
            
            return [
                {
                    "payment_id": p.payment_id,
                    "amount": float(p.payment_amount),
                    "method": p.payment_method,
                    "status": p.payment_status,
                    "transaction_id": p.transaction_id,
                    "payment_date": str(p.payment_date),
                    "payment_time": str(p.payment_time)
                }
                for p in payments
            ]
            
        except Exception as e:
            return []
