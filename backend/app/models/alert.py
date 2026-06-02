"""
Model 10a: Alert
─────────────────
In-app notifications sent to Org Admins when shortage or surplus conditions occur.

Alert types:
  - shortage  : Total estimated > PO allocated. Fires immediately on estimate submission.
  - surplus   : Total estimated < PO allocated. Fires on site/PO completion.
  - completion: A manager has marked a site as complete (pending Admin verification).
  - rejection : Admin has rejected a site completion request.

De-duplication rule:
  A shortage alert for the same (org, po_schedule_b_item) is NOT re-sent
  if the item is already in shortage. It re-fires only if the shortage
  was resolved and then occurred again.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class AlertType(str, enum.Enum):
    SHORTAGE = "shortage"
    SURPLUS = "surplus"
    COMPLETION = "completion"
    REJECTION = "rejection"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)

    # Type of alert
    alert_type = Column(SAEnum(AlertType), nullable=False, index=True)

    # Human-readable message shown in the UI
    message = Column(Text, nullable=False)

    # Structured context data for navigation (e.g., {"po_id": "...", "site_id": "...", "item_code": "HT-001"})
    context = Column(JSONB, default=dict, nullable=False, server_default="'{}'")

    # Has the Admin read/dismissed this alert?
    is_read = Column(Boolean, default=False, nullable=False, index=True)

    # Was the email notification sent successfully?
    email_sent = Column(Boolean, default=False, nullable=False)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<Alert id={self.id} type={self.alert_type} read={self.is_read}>"


