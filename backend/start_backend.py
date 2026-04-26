#!/usr/bin/env python3
"""
Simple Backend Startup Script
"""

import socket
import uvicorn
from payment_app import app

def find_free_port(start_port=8000):
    """Find a free port"""
    for port in range(start_port, 9000):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return 8000

if __name__ == "__main__":
    port = find_free_port()
    print(f"Starting Bus Ticket System Backend on port {port}")
    print(f"API will be available at: http://localhost:{port}")
    print(f"Frontend should connect to: http://localhost:{port}")
    
    uvicorn.run("payment_app:app", host="0.0.0.0", port=port, log_level="info", reload=True)
