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
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import custom QR generator
from custom_qr import CustomQRGenerator, generate_ticket_qr, generate_payment_qr

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

import urllib.parse

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
        """Generate QR code for payment using custom QR generator"""
        try:
            # Use custom QR generator for enhanced features
            return generate_payment_qr(payment_data)
            
        except Exception as e:
            raise Exception(f"QR Code generation failed: {str(e)}")
    
    @staticmethod
    def generate_upi_qr(upi_data: UPIPaymentRequest) -> str:
        """Generate UPI QR code using custom QR generator"""
        try:
            # Format amount and encode parameters
            formatted_amount = "{:.2f}".format(upi_data.amount)
            encoded_name = urllib.parse.quote(upi_data.merchant_name)
            encoded_note = urllib.parse.quote(upi_data.transaction_note)
            
            # Add transaction reference for better app compatibility
            txn_ref = f"BT{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Create UPI URL with proper encoding, mode, tr and mc
            upi_url = f"upi://pay?pa={upi_data.upi_id}&pn={encoded_name}&am={formatted_amount}&cu=INR&tn={encoded_note}&tr={txn_ref}&mc=0000&mode=02"
            
            # Create UPI payment data for custom QR generator
            upi_payment_data = {
                "payment_id": f"UPI_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "transaction_id": f"TXN_UPI_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": upi_data.amount,
                "merchant_name": upi_data.merchant_name,
                "upi_url": upi_url,
                "expires_at": (datetime.now() + timedelta(minutes=15)).isoformat()
            }
            
            # Use custom QR generator
            return generate_payment_qr(upi_payment_data)
            
        except Exception as e:
            raise Exception(f"UPI QR Code generation failed: {str(e)}")
    
    @staticmethod
    def generate_ticket_qr(ticket_data: Dict) -> str:
        """Generate QR code for tickets using custom QR generator"""
        try:
            # Use custom QR generator for tickets
            return generate_ticket_qr(ticket_data)
            
        except Exception as e:
            raise Exception(f"Ticket QR Code generation failed: {str(e)}")

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
                    formatted_amount = "{:.2f}".format(request.amount)
                    encoded_name = urllib.parse.quote("Bus Ticket System")
                    encoded_note = urllib.parse.quote(f"Bus Ticket Payment - {payment_id}")
                    txn_ref = f"BT{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    upi_url = f"upi://pay?pa={request.upi_id}&pn={encoded_name}&am={formatted_amount}&cu=INR&tn={encoded_note}&tr={txn_ref}&mc=0000&mode=02"
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
            # For demo, we assume payment is received when the conductor confirms it.
            return {
                "success": True,
                "payment_id": payment_id,
                "status": "completed",
                "verified_at": datetime.now().isoformat(),
                "amount": None,
                "transaction_id": payment_id
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
            
            # Check if payment already exists
            existing_payment = self.db.query(models.Payment).filter(
                models.Payment.ticket_id == ticket_data.get("ticket_id")
            ).first()
            
            if existing_payment:
                # Update existing payment
                existing_payment.payment_amount = ticket_data.get("amount")
                existing_payment.payment_method = ticket_data.get("payment_method")
                existing_payment.payment_status = "Success"
                existing_payment.transaction_id = ticket_data.get("transaction_id")
                existing_payment.upi_id = ticket_data.get("upi_id")
                existing_payment.payment_date = datetime.now().date()
                existing_payment.payment_time = datetime.now().time()
                existing_payment.payment_received_by = ticket_data.get("conductor_id")
                payment = existing_payment
            else:
                # Create new payment record
                payment = models.Payment(
                    ticket_id=ticket_data.get("ticket_id"),
                    payment_amount=ticket_data.get("amount"),
                    payment_method=ticket_data.get("payment_method"),
                    payment_status="Success",
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
                
                # Check if QR code already exists
                existing_qr = self.db.query(models.QRCode).filter(
                    models.QRCode.ticket_id == ticket_data.get("ticket_id")
                ).first()
                
                if existing_qr:
                    # Update existing QR code
                    existing_qr.qr_code_id = payment_response.payment_id
                    existing_qr.qr_data = json.dumps({
                        "payment_id": payment_response.payment_id,
                        "amount": ticket_data.get("amount"),
                        "method": ticket_data.get("payment_method"),
                        "created_at": datetime.now().isoformat()
                    })
                    existing_qr.qr_validity_status = "Valid"
                else:
                    # Create new QR code record
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
                    "transaction_id": payment_response.transaction_id,
                    "qr_code_data": payment_response.qr_code_data,
                    "payment_url": payment_response.payment_url,
                    "upi_url": payment_response.upi_url,
                    "expires_at": payment_response.expires_at,
                    "payment_status": payment.payment_status,
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
