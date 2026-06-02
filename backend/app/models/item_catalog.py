"""
Model 7 Fix: ItemCatalog (clean version)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class ItemCatalog(Base):
    __tablename__ = "item_catalog"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    item_code = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    unit = Column(String(50), nullable=False)
    current_rate = Column(Numeric(12, 2), nullable=True)

    # Price history: [{"rate": 150.00, "changed_at": "2024-01-15T10:00:00", "changed_by": "user_id"}]
    price_history = Column(JSONB, default=list, nullable=False, server_default="'[]'")

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organisation = relationship("Organisation", back_populates="item_catalog")
    po_items = relationship("POScheduleBItem", back_populates="catalog_item")

    def __repr__(self):
        return f"<ItemCatalog id={self.id} item_code={self.item_code}>"
