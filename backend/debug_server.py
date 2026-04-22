"""
Debug Server - Simple test to identify issues
"""

import sys
import traceback

def test_imports():
    """Test all imports"""
    print("Testing imports...")
    try:
        from app.database import test_connection
        print("  Database module: OK")
        
        from app.simple_auth import login_for_access_token
        print("  Auth module: OK")
        
        from app.services import TicketBookingService
        print("  Services module: OK")
        
        from app.validators import ConductorBase
        print("  Validators module: OK")
        
        return True
    except Exception as e:
        print(f"  Import error: {e}")
        traceback.print_exc()
        return False

def test_database():
    """Test database connection"""
    print("Testing database...")
    try:
        from app.database import test_connection
        result = test_connection()
        print(f"  Database: {result}")
        return result[0]
    except Exception as e:
        print(f"  Database error: {e}")
        return False

def test_auth():
    """Test authentication"""
    print("Testing authentication...")
    try:
        from app.simple_auth import login_for_access_token
        result = login_for_access_token({'username': 'admin', 'password': 'admin123'})
        print(f"  Auth: {result}")
        return True
    except Exception as e:
        print(f"  Auth error: {e}")
        return False

def test_app():
    """Test FastAPI app"""
    print("Testing FastAPI app...")
    try:
        from production_app import app
        print("  FastAPI app: OK")
        return True
    except Exception as e:
        print(f"  App error: {e}")
        traceback.print_exc()
        return False

def main():
    print("=== Bus Ticket System - Debug Test ===")
    
    tests = [
        ("Imports", test_imports),
        ("Database", test_database),
        ("Authentication", test_auth),
        ("FastAPI App", test_app)
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n{name}:")
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"  FAILED: {e}")
            results.append((name, False))
    
    print("\n=== SUMMARY ===")
    all_passed = True
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{name}: {status}")
        if not result:
            all_passed = False
    
    if all_passed:
        print("\nAll tests passed! System is ready.")
    else:
        print("\nSome tests failed. Check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    main()
