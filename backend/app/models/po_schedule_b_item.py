"""
Model 8: POScheduleBItem
─────────────────────────
Schedule B items specific to a single Purchase Order.

Key design decisions:
  1. locked_rate: The unit rate is COPIED from ItemCatalog at the time of PO creation.
     If the catalog price changes later, this value is NOT affected.
     This matches real-world government contracts where rates are locked at tender time.

  2. allocated_qty: The government-allocated quantity for this item across the ENTIRE PO.
     All manager estimates across all sites under this PO roll up against this number.

  3. custom_fields: JSONB field for any extra metadata Admin wants to add
     (e.g., vendor, delivery date, storage location). No schema changes needed.

Inventory formula (calculated in inventory_service.py, not stored here):
  Total Estimated = SUM(manager_estimates.estimated_qty) WHERE po_schedule_b_item_id = this.id
  Remaining       = allocated_qty - Total Estimated
  Shortage        = Total Estimated > allocated_qty
  Surplus         = Site/PO completed AND Total Estimated < allocated_qty
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class POScheduleBItem(Base):
    __tablename__ = "po_schedule_b_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    po_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)

    # Reference to the master catalog item (for display purposes)
    item_catalog_id = Column(UUID(as_uuid=True), ForeignKey("item_catalog.id"), nullable=True)

    # Copied directly from ItemCatalog at creation time — NEVER changes after that
    item_code = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    unit = Column(String(50), nullable=False)

    # The unit rate locked at time of PO creation (does NOT change if catalog price updates)
    locked_rate = Column(Numeric(12, 2), nullable=True)

    # Government-allocated quantity for this item across the WHOLE PO
    allocated_qty = Column(Numeric(15, 3), nullable=False, default=0)

    # Custom metadata fields (e.g., {"vendor": "ABC Ltd", "delivery_date": "2024-03-01"})
    custom_fields = Column(JSONB, default=dict, nullable=False, server_default="'{}'")

    # Sort order for display in the UI (matches Schedule B document order)
    sort_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # ── Relationships ──────────────────────────────────────────────────────────
    purchase_order = relationship("PurchaseOrder", back_populates="schedule_b_items")
    catalog_item = relationship("ItemCatalog", back_populates="po_items")
    estimates = relationship("ManagerEstimate", back_populates="schedule_b_item", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<POScheduleBItem id={self.id} item_code={self.item_code} allocated={self.allocated_qty}>"
