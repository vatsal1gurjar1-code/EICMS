"""
Model 3: PurchaseOrder
──────────────────────
Represents a government work order received by the contractor.

Hierarchy: Organisation → PurchaseOrder → ReleaseNumber → Site

Each PO is linked to one or more Release Numbers.
The Schedule B items (materials list) is attached at the PO level.
All site estimates roll up to the PO level for inventory tracking.

Status flow: active → completed
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, Date, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class POStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Which organisation owns this PO
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Government-issued identifiers
    po_number = Column(String(100), nullable=False)        # e.g., "PO-2024-001"
    tender_id = Column(String(100), nullable=True)         # e.g., "TND-MGVCL-2024-045"

    # Human-readable description
    description = Column(String(500), nullable=True)

    # Financial details
    order_value = Column(Numeric(15, 2), nullable=True)    # Total contract value in INR

    # Contract dates
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    # Current status
    status = Column(SAEnum(POStatus), nullable=False, default=POStatus.ACTIVE)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────────
    organisation = relationship("Organisation", back_populates="purchase_orders")
    release_numbers = relationship("ReleaseNumber", back_populates="purchase_order", cascade="all, delete-orphan")
    schedule_b_items = relationship("POScheduleBItem", back_populates="purchase_order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PurchaseOrder id={self.id} po_number={self.po_number} status={self.status}>"
