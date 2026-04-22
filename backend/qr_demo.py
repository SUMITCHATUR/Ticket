"""
QR Code Generation Demo for Bus Ticket System
Shows exactly how QR codes are generated for tickets
"""

import sys
import os
sys.path.append('.')

from app.payment_system import QRCodeGenerator, UPIPaymentRequest
import json
import base64
from datetime import datetime, timedelta

def demo_ticket_qr():
    """Demo QR code generation for actual ticket"""
    print("=== BUS TICKET QR CODE GENERATION DEMO ===\n")
    
    # 1. Create a sample ticket booking
    print("1. CREATING SAMPLE TICKET BOOKING...")
    ticket_data = {
        "ticket_id": 123,
        "ticket_number": "TKT-20240422-001",
        "passenger_name": "Rahul Sharma",
        "passenger_id": 456,
        "bus_route_id": 789,
        "seat_id": 15,
        "conductor_id": 101,
        "amount": 550.00,
        "payment_method": "UPI",
        "upi_id": "rahul@upi"
    }
    
    print(f"   Ticket Number: {ticket_data['ticket_number']}")
    print(f"   Passenger: {ticket_data['passenger_name']}")
    print(f"   Amount: Rs. {ticket_data['amount']}")
    print(f"   Payment Method: {ticket_data['payment_method']}")
    print(f"   UPI ID: {ticket_data['upi_id']}")
    print()
    
    # 2. Generate Payment QR Code
    print("2. GENERATING PAYMENT QR CODE...")
    payment_data = {
        "payment_id": f"PAY_{datetime.now().strftime('%Y%m%d')}_{ticket_data['ticket_id']:03d}",
        "transaction_id": f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{ticket_data['ticket_id']:03d}",
        "amount": ticket_data["amount"],
        "merchant_name": "Bus Ticket System",
        "ticket_number": ticket_data["ticket_number"],
        "passenger_name": ticket_data["passenger_name"],
        "expires_at": (datetime.now() + timedelta(minutes=15)).isoformat()
    }
    
    try:
        payment_qr = QRCodeGenerator.generate_payment_qr(payment_data)
        print("   Payment QR Code: SUCCESS")
        print(f"   Payment ID: {payment_data['payment_id']}")
        print(f"   Transaction ID: {payment_data['transaction_id']}")
        print(f"   QR Code Size: {len(payment_qr)} characters")
        print(f"   QR Code Type: Base64 PNG Image")
        print(f"   Expires At: {payment_data['expires_at']}")
        print()
        
        # Save QR code to file for demo
        qr_image_data = payment_qr.split(',')[1]  # Remove data:image/png;base64, prefix
        qr_image_bytes = base64.b64decode(qr_image_data)
        
        with open('payment_qr_demo.png', 'wb') as f:
            f.write(qr_image_bytes)
        print("   QR Code saved as: payment_qr_demo.png")
        print()
        
    except Exception as e:
        print(f"   Payment QR Error: {str(e)}")
        return
    
    # 3. Generate UPI QR Code
    print("3. GENERATING UPI QR CODE...")
    upi_request = UPIPaymentRequest(
        upi_id=ticket_data["upi_id"],
        amount=ticket_data["amount"],
        merchant_name="Bus Ticket System",
        transaction_note=f"Bus Ticket - {ticket_data['ticket_number']}"
    )
    
    try:
        upi_qr = QRCodeGenerator.generate_upi_qr(upi_request)
        print("   UPI QR Code: SUCCESS")
        print(f"   UPI URL: upi://pay?pa={upi_request.upi_id}&pn={upi_request.merchant_name}&am={upi_request.amount}&cu=INR&tn={upi_request.transaction_note}")
        print(f"   QR Code Size: {len(upi_qr)} characters")
        print()
        
        # Save UPI QR code to file
        upi_image_data = upi_qr.split(',')[1]
        upi_image_bytes = base64.b64decode(upi_image_data)
        
        with open('upi_qr_demo.png', 'wb') as f:
            f.write(upi_image_bytes)
        print("   UPI QR Code saved as: upi_qr_demo.png")
        print()
        
    except Exception as e:
        print(f"   UPI QR Error: {str(e)}")
        return
    
    # 4. Show QR Code Data Structure
    print("4. QR CODE DATA STRUCTURE...")
    print("   Payment QR contains:")
    print(json.dumps(payment_data, indent=6))
    print()
    
    # 5. Show complete workflow
    print("5. COMPLETE PAYMENT WORKFLOW...")
    print("   Step 1: User selects ticket and seat")
    print("   Step 2: System generates payment QR code")
    print("   Step 3: User scans QR with UPI app")
    print("   Step 4: Payment processed via UPI")
    print("   Step 5: System verifies payment")
    print("   Step 6: Ticket confirmed with final QR")
    print("   Step 7: User receives ticket QR for boarding")
    print()
    
    # 6. Generate Final Ticket QR (for boarding)
    print("6. GENERATING FINAL TICKET QR (FOR BOARDING)...")
    final_ticket_data = {
        "ticket_id": ticket_data["ticket_id"],
        "ticket_number": ticket_data["ticket_number"],
        "passenger_name": ticket_data["passenger_name"],
        "seat_number": "15A",
        "bus_number": "MH-12-AB-1234",
        "route": "Mumbai to Pune",
        "departure_time": "14:30",
        "date": "2024-04-22",
        "status": "CONFIRMED",
        "payment_status": "PAID"
    }
    
    try:
        final_qr = QRCodeGenerator.generate_payment_qr({
            "payment_id": f"TKT_{ticket_data['ticket_id']}",
            "amount": ticket_data["amount"],
            "merchant_name": "Bus Ticket System",
            "ticket_data": final_ticket_data,
            "expires_at": (datetime.now() + timedelta(days=1)).isoformat()
        })
        
        print("   Final Ticket QR: SUCCESS")
        print(f"   QR Code Size: {len(final_qr)} characters")
        print()
        
        # Save final ticket QR
        final_image_data = final_qr.split(',')[1]
        final_image_bytes = base64.b64decode(final_image_data)
        
        with open('ticket_qr_demo.png', 'wb') as f:
            f.write(final_image_bytes)
        print("   Final Ticket QR saved as: ticket_qr_demo.png")
        print()
        
    except Exception as e:
        print(f"   Final Ticket QR Error: {str(e)}")
    
    print("=== QR CODE DEMO COMPLETE ===")
    print("\nGenerated Files:")
    print("- payment_qr_demo.png (Payment QR Code)")
    print("- upi_qr_demo.png (UPI QR Code)")
    print("- ticket_qr_demo.png (Final Ticket QR)")
    print("\nThese QR codes can be scanned with any QR scanner app!")

if __name__ == "__main__":
    demo_ticket_qr()
