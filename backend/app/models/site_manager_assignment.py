"""
Model 6: SiteManagerAssignment
───────────────────────────────
Links Field Managers to Sites.

Why a table instead of a single column?
  - Supports MULTIPLE managers on the same site
  - Supports manager REASSIGNMENT mid-contract
  - Keeps full HISTORY of who was assigned and when
  - A single manager_id column on Site would not support any of these
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class SiteManagerAssignment(Base):
    __tablename__ = "site_manager_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)

    # The site being assigned
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)

    # The manager being assigned (must be a user with role=manager)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # When the assignment was made
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Who made the assignment (should be an org_admin)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Is this assignment currently active?
    # Setting to False instead of deleting preserves assignment history.
    is_active = Column(Boolean, default=True, nullable=False)

    # When this assignment was deactivated (removed)
    removed_at = Column(DateTime(timezone=True), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    site = relationship("Site", back_populates="manager_assignments")
    manager = relationship("User", back_populates="site_assignments", foreign_keys=[user_id])

    def __repr__(self):
        return f"<SiteManagerAssignment site_id={self.site_id} user_id={self.user_id} active={self.is_active}>"
