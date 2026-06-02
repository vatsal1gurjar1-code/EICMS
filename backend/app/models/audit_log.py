"""
Model 10b: AuditLog — separate file
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action_type = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=True)
    target_id = Column(String(255), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action_type}>"
