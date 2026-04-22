from fastapi import FastAPI
from app.database import test_connection

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Bus Ticket Booking System API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    success, message = test_connection()
    return {
        "status": "healthy" if success else "unhealthy",
        "database": message
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
