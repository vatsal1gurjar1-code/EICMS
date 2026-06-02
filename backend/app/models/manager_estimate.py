"""
Model 9: ManagerEstimate
─────────────────────────
A quantity estimate submitted by a Field Manager for a specific
Schedule B item at a specific site.

Key rules:
  - A manager can only submit estimates for sites they are assigned to
  - Estimates can be edited (UPDATE) until the site is locked or completed
  - One estimate per (site_id, po_schedule_b_item_id) pair
    If a manager re-submits, we UPDATE the existing estimate (not insert a new one)
  - When an estimate is submitted/updated, the inventory_service runs the shortage check

The inventory calculation uses SUM(estimated_qty) across all estimates for a
given po_schedule_b_item_id to compute the total usage for that PO item.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ManagerEstimate(Base):
    __tablename__ = "manager_estimates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Which site this estimate is for
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)

    # Which Schedule B item this estimate is for
    po_schedule_b_item_id = Column(UUID(as_uuid=True), ForeignKey("po_schedule_b_items.id", ondelete="CASCADE"), nullable=False, index=True)

    # The quantity the manager estimates is needed for this item at this site
    estimated_qty = Column(Numeric(15, 3), nullable=False, default=0)

    # Who submitted this estimate and when
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # When this estimate was last updated
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # ── Constraints ────────────────────────────────────────────────────────────
    # Ensures only ONE estimate per (site, schedule_b_item) pair.
    # If a manager re-submits, we UPDATE the existing row using upsert logic.
    __table_args__ = (
        UniqueConstraint("site_id", "po_schedule_b_item_id", name="uq_estimate_site_item"),
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    site = relationship("Site", back_populates="estimates")
    schedule_b_item = relationship("POScheduleBItem", back_populates="estimates")

    def __repr__(self):
        return f"<ManagerEstimate site_id={self.site_id} item_id={self.po_schedule_b_item_id} qty={self.estimated_qty}>"
