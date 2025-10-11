from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user_model import User 
from app.api.schemas.user_schema import UserCreate
from app.core.security.hashing import hash_password, verify_password
from app.core.security.jwt_handler import create_access_token

def signup_local(db: Session, payload: UserCreate):
    existing = db.query(User).filter(User.email == payload.email).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return new_user, token

def authenticate_local(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user or not user.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not verify_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return user, token