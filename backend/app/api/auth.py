"""
app/api/auth.py — Authentication Routes
─────────────────────────────────────────
POST /api/auth/login   → Login and receive JWT token
POST /api/auth/refresh → Refresh a token
GET  /api/auth/me      → Get current user profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login with email and password. Returns a JWT access token.

    The token must be included in all future requests as:
      Authorization: Bearer <token>
    """
    # Find the user by email
    user = db.query(User).filter(
        User.email == form_data.username,
        User.is_active == True
    ).first()

    # Check credentials (never reveal WHICH part was wrong — always say "invalid credentials")
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token with user info embedded
    token_data = {
        "sub": str(user.id),
        "org_id": str(user.org_id) if user.org_id else None,
        "role": user.role.value,
        "email": user.email,
    }
    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "org_id": str(user.org_id) if user.org_id else None,
        }
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently logged-in user."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "org_id": str(current_user.org_id) if current_user.org_id else None,
        "is_active": current_user.is_active,
    }
