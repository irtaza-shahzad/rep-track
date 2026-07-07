from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user_model import User
from app.api.schemas.user_schema import UserUpdate
from app.core.security.hashing import hash_password

def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User with User ID: {user_id} not found"
        )
    return user

def update_user(db: Session, user_id: int, payload: UserUpdate) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User with User ID: {user_id} not found"
        )

    if payload.name:
        user.name = payload.name
    if payload.password:
        user.password = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User with User ID: {user_id} not found"
        )
    
    db.delete(user)
    db.commit()
    return True