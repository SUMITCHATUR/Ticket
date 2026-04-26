import requests
import json
import base64

def test_upi_qr():
    base_url = "http://localhost:8000"
    
    # 1. Login
    login_url = f"{base_url}/api/auth/login"
    login_payload = {"username": "admin", "password": "admin123"}
    
    try:
        login_res = requests.post(login_url, json=login_payload)
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.status_code}")
            return
            
        token = login_res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Generate UPI QR
        qr_url = f"{base_url}/api/payment/upi/generate-qr"
        payload = {
            "upi_id": "test@upi",
            "amount": 100.50,
            "merchant_name": "Test Merchant",
            "transaction_note": "Test Note"
        }
        
        response = requests.post(qr_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            qr_data = data.get('qr_code_data', '')
            
            if qr_data.startswith("data:image/png;base64,"):
                print("PREFIX_CHECK: SUCCESS")
            else:
                print("PREFIX_CHECK: FAILED")
                print(f"DEBUG_START: {qr_data[:30]}")
                
            print(f"UPI_URL: {data.get('upi_url')}")
        else:
            print(f"API_ERROR: {response.status_code}")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_upi_qr()
