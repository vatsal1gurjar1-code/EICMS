"""
Model 4: ReleaseNumber
──────────────────────
A subdivision of a Purchase Order issued by the government body.
Each Release Number covers one or more Sites.

Hierarchy: PurchaseOrder → ReleaseNumber → Site
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ReleaseNumber(Base):
    __tablename__ = "release_numbers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)

    # The government-issued release number string (e.g., "REL-001", "R/2024/45")
    release_no = Column(String(100), nullable=False)

    description = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────────
    purchase_order = relationship("PurchaseOrder", back_populates="release_numbers")
    sites = relationship("Site", back_populates="release_number", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ReleaseNumber id={self.id} release_no={self.release_no}>"
