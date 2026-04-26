import urllib.request, json
data=json.dumps({
    "booking_request": {
        "passenger": {
            "passenger_name": "test", 
            "contact_number": "1234567890", 
            "age": 25, 
            "gender": "Male", 
            "id_type": "Aadhar", 
            "id_number": "1234"
        }, 
        "bus_route_id": 1, 
        "seat_id": 1, 
        "conductor_id": 1, 
        "ticket_price": 10.0
    }, 
    "payment_request": {
        "payment_method": "Cash", 
        "payment_amount": 10.0
    }
}).encode('utf-8')
try:
    req=urllib.request.Request('http://localhost:8000/tickets/book-with-payment', data=data, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer test'})
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
