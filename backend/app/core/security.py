"""
app/core/security.py
────────────────────
All authentication and password security utilities:
  - Password hashing with bcrypt
  - JWT token creation and verification
  - FastAPI dependency to get the current logged-in user
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, set_rls_context

# ── Password Hashing ──────────────────────────────────────────────────────────
# bcrypt is a one-way hashing algorithm. Passwords are NEVER stored in plain text.
# When a user logs in, we hash what they typed and compare it to the stored hash.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Converts a plain text password into a secure bcrypt hash."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks if a plain text password matches the stored hash.
    Returns True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Tokens ────────────────────────────────────────────────────────────────
# JWT = JSON Web Token. A signed string that proves who the user is.
# Format: HEADER.PAYLOAD.SIGNATURE
# The payload contains the user's ID, org_id, and role.
# The signature is created with JWT_SECRET_KEY so it cannot be faked.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token.

    Args:
        data: Dictionary of claims to include in the token (user_id, org_id, role)
        expires_delta: How long until the token expires (default: JWT_EXPIRE_HOURS)

    Returns:
        A signed JWT string to send to the client.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(hours=settings.jwt_expire_hours)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT token.

    Raises:
        HTTPException 401 if the token is invalid or expired.

    Returns:
        The decoded payload dictionary.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ── Current User Dependency ───────────────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency that extracts and validates the logged-in user
    from the JWT token in the Authorization header.

    Also sets the PostgreSQL RLS context so all queries are automatically
    filtered to the current user's organisation.

    Usage in a route:
        @router.get("/protected")
        def protected_route(current_user = Depends(get_current_user)):
            return {"user": current_user.email}
    """
    from app.models.user import User  # Import here to avoid circular imports

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    org_id = payload.get("org_id")
    role = payload.get("role")

    # Set RLS context so PostgreSQL knows which org this user belongs to
    set_rls_context(db, org_id, role)

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account has been deactivated.",
        )
    return user


def require_role(*roles: str):
    """
    FastAPI dependency factory for role-based access control.

    Usage:
        @router.post("/admin-only")
        def admin_route(current_user = Depends(require_role("super_admin", "org_admin"))):
            ...

    This raises 403 Forbidden if the user's role is not in the allowed list.
    """
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}",
            )
        return current_user
    return role_checker
