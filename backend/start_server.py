#!/usr/bin/env python3
"""
Bus Ticket Booking System - Server Startup Script
Automatically finds available port and starts the server
"""

import socket
import sys
import time
from production_app import app
import uvicorn

def find_free_port(start_port=8000, max_port=9000):
    """Find a free port in the given range"""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

def main():
    print("=== Bus Ticket Booking System - Server Startup ===")
    print("Finding available port...")
    
    # Find free port
    port = find_free_port()
    if not port:
        print("ERROR: No free ports available in range 8000-9000")
        sys.exit(1)
    
    print(f"Starting server on port {port}...")
    print(f"API will be available at: http://localhost:{port}")
    print(f"Documentation at: http://localhost:{port}/docs")
    print(f"Health check at: http://localhost:{port}/health")
    print("\nLogin Credentials:")
    print("  Admin: admin / admin123")
    print("  Conductor: conductor / conductor123")
    print("\nPress CTRL+C to stop the server")
    print("=" * 50)
    
    try:
        # Start server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"ERROR: Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
