#!/usr/bin/env python3
"""
Backend Runner - Fixed Port 8001
"""

import uvicorn
from payment_app import app

if __name__ == "__main__":
    print("Starting Bus Ticket System Backend on port 8001")
    print("API: http://localhost:8001")
    print("Docs: http://localhost:8001/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
