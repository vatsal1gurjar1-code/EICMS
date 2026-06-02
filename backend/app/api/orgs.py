"""
app/api/orgs.py — Organisation & User Management Routes
─────────────────────────────────────────────────────────
POST   /api/orgs                    → Super Admin creates an org
GET    /api/orgs/users              → Org Admin lists all users in their org
POST   /api/orgs/users              → Org Admin creates a Manager account
PATCH  /api/orgs/users/{user_id}    → Org Admin enables/disables a Manager
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import require_role, hash_password
from app.models.user import User, UserRole
from app.models.organisation import Organisation

router = APIRouter()


# ── Pydantic Schemas (Request/Response shapes) ─────────────────────────────────
class CreateOrgRequest(BaseModel):
    name: str
    admin_email: EmailStr
    admin_password: str
    admin_name: str


class CreateManagerRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: str


class UpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    full_name: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
def create_organisation(
    body: CreateOrgRequest,
    current_user=Depends(require_role("super_admin")),
    db: Session = Depends(get_db),
):
    """Super Admin creates a new contractor organisation (tenant)."""
    existing = db.query(Organisation).filter(Organisation.name == body.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="An organisation with this name already exists.")

    org = Organisation(name=body.name)
    db.add(org)
    db.flush()

    admin_user = User(
        org_id=org.id,
        email=body.admin_email,
        full_name=body.admin_name,
        password_hash=hash_password(body.admin_password),
        role=UserRole.ORG_ADMIN,
        is_active=True,
    )
    db.add(admin_user)
    
    db.commit()
    db.refresh(org)
    return {"id": str(org.id), "name": org.name, "created_at": org.created_at}


@router.get("/users")
def list_users(
    current_user=Depends(require_role("org_admin", "super_admin")),
    db: Session = Depends(get_db),
):
    """Org Admin lists all users in their organisation. Super Admin lists everyone."""
    if current_user.role == UserRole.SUPER_ADMIN:
        users = db.query(User).all()
    else:
        users = db.query(User).filter(User.org_id == current_user.org_id).all()
        
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "org_name": u.organisation.name if u.organisation else "System"
        }
        for u in users
    ]


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_manager(
    body: CreateManagerRequest,
    current_user=Depends(require_role("org_admin")),
    db: Session = Depends(get_db),
):
    """Org Admin creates a new Field Manager account."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    manager = User(
        org_id=current_user.org_id,
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role=UserRole.MANAGER,
        is_active=True,
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    return {"id": str(manager.id), "email": manager.email, "role": manager.role.value}


@router.patch("/users/{user_id}")
def update_user(
    user_id: uuid.UUID,
    body: UpdateUserRequest,
    current_user=Depends(require_role("org_admin")),
    db: Session = Depends(get_db),
):
    """Org Admin enables or disables a Manager account."""
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == current_user.org_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.full_name is not None:
        user.full_name = body.full_name

    db.commit()
    return {"id": str(user.id), "is_active": user.is_active, "full_name": user.full_name}
