from fastapi import FastAPI
from app.database import test_connection

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Bus Ticket Booking System API - Test", "version": "1.0.0"}

@app.get("/health")
def health_check():
    success, message = test_connection()
    return {
        "status": "healthy" if success else "unhealthy",
        "database": message
    }

@app.get("/test-booking")
def test_booking():
    return {
        "message": "Booking endpoint test",
        "status": "ready"
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting server on port 8010...")
    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="info")
