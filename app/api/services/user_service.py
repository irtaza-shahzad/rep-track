from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user_model import User
from app.api.schemas.user_schema import UserCreate, UserUpdate
# from app.core.security import hash_password


def create_user(db: Session, user: UserCreate) -> User:
    existing_user: User | None = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already in use"
        )
    
    new_user = User(
        name=user.name,
        email=user.email,
        password=user.password  # hash later with hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_all_users(db: Session) -> list[User]:
    return db.query(User).all()


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
        user.name = payload.name  # type: ignore[attr-defined]
    if payload.password:
        user.password = payload.password  # type: ignore[attr-defined]

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
