from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib
import os
import base64

# Simple authentication without bcrypt
security = HTTPBearer()

class SimpleAuth:
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Simple password hashing using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    
    @staticmethod
    def create_simple_token(username: str) -> str:
        """Create simple token"""
        timestamp = str(datetime.now().timestamp())
        token_data = f"{username}:{timestamp}"
        return base64.b64encode(token_data.encode()).decode()
    
    @staticmethod
    def verify_simple_token(token: str) -> str:
        """Verify simple token"""
        try:
            decoded = base64.b64decode(token.encode()).decode()
            username, timestamp = decoded.split(":")
            # Check if token is not too old (30 minutes)
            token_time = datetime.fromtimestamp(float(timestamp))
            if datetime.now() - token_time > timedelta(minutes=30):
                raise HTTPException(status_code=401, detail="Token expired")
            return username
        except:
            raise HTTPException(status_code=401, detail="Invalid token")

# User models
class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = "conductor"
    disabled: Optional[bool] = False

class Token(BaseModel):
    access_token: str
    token_type: str

# Mock users
fake_users_db = {
    "conductor": {
        "username": "conductor",
        "full_name": "Bus Conductor",
        "email": "conductor@busticket.com",
        "hashed_password": SimpleAuth.hash_password("conductor123"),
        "disabled": False,
        "role": "conductor"
    },
    "admin": {
        "username": "admin",
        "full_name": "System Administrator",
        "email": "admin@busticket.com",
        "hashed_password": SimpleAuth.hash_password("admin123"),
        "disabled": False,
        "role": "admin"
    }
}

def get_user(username: str) -> Optional[User]:
    """Get user"""
    if username in fake_users_db:
        user_dict = fake_users_db[username]
        return User(**user_dict)
    return None

def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate user"""
    user = get_user(username)
    if not user:
        return None
    if not SimpleAuth.verify_password(password, fake_users_db[username]["hashed_password"]):
        return None
    return user

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user"""
    try:
        username = SimpleAuth.verify_simple_token(credentials.credentials)
        user = get_user(username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def check_conductor_role(current_user: User = Depends(get_current_active_user)) -> User:
    """Check conductor role"""
    if current_user.role not in ["conductor", "admin"]:
        raise HTTPException(status_code=403, detail="Conductor or Admin role required")
    return current_user

def check_admin_role(current_user: User = Depends(get_current_active_user)) -> User:
    """Check admin role"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return current_user

def login_for_access_token(form_data: dict) -> Token:
    """Login and get token"""
    user = authenticate_user(form_data["username"], form_data["password"])
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    access_token = SimpleAuth.create_simple_token(user.username)
    return {"access_token": access_token, "token_type": "bearer"}
