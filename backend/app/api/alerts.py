"""app/api/alerts.py — Alert Routes"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.alert import Alert
import uuid

router = APIRouter()


@router.get("")
def list_alerts(current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """List all alerts for the current organisation, newest first."""
    alerts = db.query(Alert).filter(
        Alert.org_id == current_user.org_id
    ).order_by(Alert.created_at.desc()).limit(50).all()

    return [
        {
            "id": str(a.id),
            "alert_type": a.alert_type.value,
            "message": a.message,
            "context": a.context,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.patch("/{alert_id}/read")
def mark_alert_read(alert_id: uuid.UUID, current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Mark a single alert as read."""
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.org_id == current_user.org_id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"message": "Alert marked as read."}


@router.patch("/read-all")
def mark_all_read(current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Mark all alerts as read for the current org."""
    db.query(Alert).filter(Alert.org_id == current_user.org_id, Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All alerts marked as read."}
