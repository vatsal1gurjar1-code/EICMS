"""
Model 1: Organisation
─────────────────────
Represents a contractor company registered in EICMS.
This is the top-level tenant. All data below is scoped to an org.

In multi-tenancy, every other table has an org_id that references this table.
Row-Level Security uses org_id to ensure companies cannot see each other's data.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Organisation(Base):
    __tablename__ = "organisations"

    # Primary key: a UUID (random unique ID, more secure than sequential integers)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The company name
    name = Column(String(255), nullable=False, unique=True)

    # Is this organisation active? Admins can deactivate an org.
    is_active = Column(Boolean, default=True, nullable=False)

    # When this organisation was created
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────────
    # These allow you to access related data:
    # e.g., org.users → all users belonging to this organisation
    users = relationship("User", back_populates="organisation", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="organisation", cascade="all, delete-orphan")
    item_catalog = relationship("ItemCatalog", back_populates="organisation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organisation id={self.id} name={self.name}>"
