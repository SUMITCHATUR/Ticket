"""
Custom QR Code Generation for Bus Ticket System
Handles custom QR code generation with enhanced features
"""

import qrcode
from qrcode.constants import ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H
import io
import base64
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomQRGenerator:
    """Enhanced QR Code Generator with custom features"""
    
    def __init__(self):
        self.default_box_size = 10
        self.default_border = 4
        self.default_error_correction = ERROR_CORRECT_M
    
    def generate_custom_qr(self, 
                          data: Any, 
                          size: str = "medium",
                          error_correction: str = "medium",
                          include_logo: bool = False,
                          custom_colors: bool = False) -> str:
        """
        Generate custom QR code with enhanced features
        
        Args:
            data: Data to encode in QR code
            size: QR code size (small, medium, large)
            error_correction: Error correction level (low, medium, quartile, high)
            include_logo: Whether to include logo (placeholder for future)
            custom_colors: Whether to use custom colors
            
        Returns:
            Base64 encoded PNG image data
        """
        try:
            # Convert data to string if it's a dict, otherwise use as is
            if isinstance(data, dict):
                qr_data = json.dumps(data, separators=(',', ':'))
            else:
                qr_data = str(data)
            
            # Create QR code instance
            qr = qrcode.QRCode(
                version=None,
                error_correction=self._get_error_correction(error_correction),
                box_size=self._get_box_size(size),
                border=self.default_border,
            )
            
            # Add data and optimize
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            # Create image with custom styling
            if custom_colors:
                img = qr.make_image(fill_color="#1a1a1a", back_color="#ffffff")
            else:
                img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Error generating custom QR: {str(e)}")
            raise
    
    def generate_ticket_qr(self, ticket_data: Dict[str, Any]) -> str:
        """Generate QR code specifically for bus tickets"""
        try:
            # Enhanced ticket data structure
            enhanced_data = {
                "type": "bus_ticket",
                "ticket_id": ticket_data.get("ticket_id"),
                "ticket_number": ticket_data.get("ticket_number"),
                "passenger_name": ticket_data.get("passenger_name"),
                "seat_number": ticket_data.get("seat_number"),
                "bus_number": ticket_data.get("bus_number"),
                "route": ticket_data.get("route"),
                "departure_time": ticket_data.get("departure_time"),
                "date": ticket_data.get("date"),
                "status": ticket_data.get("status", "CONFIRMED"),
                "generated_at": datetime.now().isoformat(),
                "valid_until": (datetime.now() + timedelta(days=1)).isoformat()
            }
            
            return self.generate_custom_qr(
                data=enhanced_data,
                size="medium",
                error_correction="medium",
                custom_colors=True
            )
            
        except Exception as e:
            logger.error(f"Error generating ticket QR: {str(e)}")
            raise
    
    def generate_payment_qr(self, payment_data: Dict[str, Any]) -> str:
        """Generate QR code specifically for payments"""
        try:
            # If it's a UPI payment, we should encode the UPI URL directly
            if "upi_url" in payment_data:
                return self.generate_custom_qr(
                    data=payment_data["upi_url"],
                    size="large",
                    error_correction="high",
                    custom_colors=True
                )

            # Enhanced payment data structure
            enhanced_data = {
                "type": "payment",
                "payment_id": payment_data.get("payment_id"),
                "transaction_id": payment_data.get("transaction_id"),
                "amount": payment_data.get("amount"),
                "merchant_name": payment_data.get("merchant_name", "Bus Ticket System"),
                "ticket_number": payment_data.get("ticket_number"),
                "passenger_name": payment_data.get("passenger_name"),
                "expires_at": payment_data.get("expires_at"),
                "generated_at": datetime.now().isoformat()
            }
            
            return self.generate_custom_qr(
                data=enhanced_data,
                size="large",
                error_correction="high",
                custom_colors=True
            )
            
        except Exception as e:
            logger.error(f"Error generating payment QR: {str(e)}")
            raise
    
    def _get_error_correction(self, level: str) -> int:
        """Get error correction constant"""
        levels = {
            "low": ERROR_CORRECT_L,
            "medium": ERROR_CORRECT_M,
            "quartile": ERROR_CORRECT_Q,
            "high": ERROR_CORRECT_H
        }
        return levels.get(level.lower(), self.default_error_correction)
    
    def _get_box_size(self, size: str) -> int:
        """Get box size based on size parameter"""
        sizes = {
            "small": 6,
            "medium": 10,
            "large": 15
        }
        return sizes.get(size.lower(), self.default_box_size)
    
    def validate_qr_data(self, data: Dict[str, Any]) -> bool:
        """Validate QR code data structure"""
        try:
            # Basic validation
            if not isinstance(data, dict):
                return False
            
            # Check for required fields based on type
            qr_type = data.get("type")
            if qr_type == "bus_ticket":
                required_fields = ["ticket_id", "ticket_number", "passenger_name"]
            elif qr_type == "payment":
                required_fields = ["payment_id", "amount", "merchant_name"]
            else:
                required_fields = []
            
            for field in required_fields:
                if field not in data:
                    logger.warning(f"Missing required field: {field}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating QR data: {str(e)}")
            return False

# Global instance
custom_qr_generator = CustomQRGenerator()

# Convenience functions
def generate_ticket_qr(ticket_data: Dict[str, Any]) -> str:
    """Convenience function to generate ticket QR"""
    return custom_qr_generator.generate_ticket_qr(ticket_data)

def generate_payment_qr(payment_data: Dict[str, Any]) -> str:
    """Convenience function to generate payment QR"""
    return custom_qr_generator.generate_payment_qr(payment_data)

def generate_custom_qr(data: Dict[str, Any], **kwargs) -> str:
    """Convenience function to generate custom QR"""
    return custom_qr_generator.generate_custom_qr(data, **kwargs)

# Test function
def test_custom_qr():
    """Test custom QR generation"""
    print("Testing Custom QR Generation...")
    
    # Test ticket QR
    ticket_data = {
        "ticket_id": 123,
        "ticket_number": "TKT-20240423-001",
        "passenger_name": "Test User",
        "seat_number": "15A",
        "bus_number": "MH-12-AB-1234",
        "route": "Mumbai to Pune",
        "departure_time": "14:30",
        "date": "2024-04-23"
    }
    
    try:
        ticket_qr = generate_ticket_qr(ticket_data)
        print(f"✓ Ticket QR generated: {len(ticket_qr)} characters")
    except Exception as e:
        print(f"✗ Ticket QR failed: {str(e)}")
    
    # Test payment QR
    payment_data = {
        "payment_id": "PAY_20240423_001",
        "transaction_id": "TXN_20240423143000_001",
        "amount": 550.00,
        "merchant_name": "Bus Ticket System",
        "ticket_number": "TKT-20240423-001",
        "passenger_name": "Test User",
        "expires_at": (datetime.now() + timedelta(minutes=15)).isoformat()
    }
    
    try:
        payment_qr = generate_payment_qr(payment_data)
        print(f"✓ Payment QR generated: {len(payment_qr)} characters")
    except Exception as e:
        print(f"✗ Payment QR failed: {str(e)}")

if __name__ == "__main__":
    test_custom_qr()
