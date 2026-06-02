"""
Model 2: User
─────────────
Represents all user accounts in the system.

Roles:
  - super_admin : Platform level. Can create organisations. Not scoped to an org.
  - org_admin   : Organisation admin. Full access within their org.
  - manager     : Field manager. Can only see their assigned sites.

Security:
  - Passwords are NEVER stored in plain text.
  - The password_hash column stores a bcrypt hash only.
  - org_id is NULL for super_admin accounts.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    """
    User roles in the system.
    Using Python enum ensures only valid roles can be assigned.
    """
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    MANAGER = "manager"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Which organisation this user belongs to.
    # NULL for super_admin (they are above the tenancy model).
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=True)

    # Login credentials
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)  # bcrypt hash, never plain text

    # Display name
    full_name = Column(String(255), nullable=True)

    # Role: super_admin | org_admin | manager
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.MANAGER)

    # Can this user log in? Admins can deactivate accounts without deleting them.
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # ── Relationships ──────────────────────────────────────────────────────────
    organisation = relationship("Organisation", back_populates="users")
    site_assignments = relationship("SiteManagerAssignment", back_populates="manager", cascade="all, delete-orphan", foreign_keys="[SiteManagerAssignment.user_id]")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
