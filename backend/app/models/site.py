"""
Model 5: Site
─────────────
The lowest level of the contract hierarchy.
Represents a physical work location assigned to one or more Field Managers.

Status flow:
  active → pending_verification → completed
         ↖──── (Admin rejects) ────┘

When a site is "completed", the surplus check runs automatically.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class SiteStatus(str, enum.Enum):
    ACTIVE = "active"                          # Work in progress, estimates editable
    PENDING_VERIFICATION = "pending_verification"  # Manager marked complete, awaiting Admin review
    COMPLETED = "completed"                    # Admin verified and closed
    CANCELLED = "cancelled"


class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    release_id = Column(UUID(as_uuid=True), ForeignKey("release_numbers.id", ondelete="CASCADE"), nullable=False, index=True)

    # The government-issued site number (e.g., "SITE-001", "S/45/2024")
    site_no = Column(String(100), nullable=False)

    # Optional location/area tag for filtering
    location = Column(String(255), nullable=True)
    area = Column(String(255), nullable=True)

    # Current workflow status
    status = Column(SAEnum(SiteStatus), nullable=False, default=SiteStatus.ACTIVE)

    # Admin can lock estimates without fully closing the site
    is_locked = Column(Boolean, default=False, nullable=False)

    # Note left by Admin when rejecting a completion request
    rejection_note = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    release_number = relationship("ReleaseNumber", back_populates="sites")
    manager_assignments = relationship("SiteManagerAssignment", back_populates="site", cascade="all, delete-orphan")
    estimates = relationship("ManagerEstimate", back_populates="site", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Site id={self.id} site_no={self.site_no} status={self.status}>"
