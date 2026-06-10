import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from pydantic import BaseModel
import bcrypt

from app.database import get_session, User

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = "OMNISHIELD_SUPER_SECRET_SECURITY_JWT_KEY_FOR_EXAMS"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 4

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str
    center_id: Optional[int] = None

# Helper functions for password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Helper function to generate JWT
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user from JWT token
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_session)) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    stmt = select(User).where(User.username == username)
    user = db.exec(stmt).first()
    if user is None:
        raise credentials_exception
    return user

# Helper classes for role checks
class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{user.role}' is not authorized. Allowed: {self.allowed_roles}"
            )
        return user

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_session)):
    # Check if user already exists
    existing = db.exec(select(User).where(User.username == req.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    valid_roles = ["SuperAdmin", "ExamBoard", "Center", "Invigilator", "Candidate"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {valid_roles}")
        
    hashed = hash_password(req.password)
    user = User(
        username=req.username,
        password_hash=hashed,
        role=req.role,
        center_id=req.center_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"status": "SUCCESS", "message": "User registered successfully", "username": user.username}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_session)):
    user = db.exec(select(User).where(User.username == req.username)).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    token = create_access_token({"sub": user.username, "role": user.role, "center_id": user.center_id})
    return {
        "status": "SUCCESS",
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "center_id": user.center_id,
        "username": user.username
    }

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "center_id": user.center_id,
        "created_at": user.created_at
    }
