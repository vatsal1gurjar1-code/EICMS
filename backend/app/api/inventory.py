"""app/api/inventory.py — Inventory Calculation Routes"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from app.core.database import get_db
from app.core.security import require_role
from app.models.purchase_order import PurchaseOrder
from app.models.po_schedule_b_item import POScheduleBItem
from app.models.manager_estimate import ManagerEstimate

router = APIRouter()


@router.get("/{po_id}")
def get_inventory(po_id: uuid.UUID, current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """
    Get full inventory breakdown for a Purchase Order.
    Shows allocated qty, total estimated, remaining, and shortage/surplus status for each item.
    """
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id, PurchaseOrder.org_id == current_user.org_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found.")

    items = db.query(POScheduleBItem).filter(POScheduleBItem.po_id == po_id).all()
    result = []

    for item in items:
        total_estimated = db.query(func.coalesce(func.sum(ManagerEstimate.estimated_qty), 0)).filter(
            ManagerEstimate.po_schedule_b_item_id == item.id
        ).scalar() or 0

        allocated = float(item.allocated_qty)
        estimated = float(total_estimated)
        remaining = allocated - estimated

        if estimated > allocated:
            inv_status = "shortage"
        elif po.status.value == "completed" and estimated < allocated:
            inv_status = "surplus"
        else:
            inv_status = "ok"

        result.append({
            "item_id": str(item.id),
            "item_code": item.item_code,
            "description": item.description,
            "unit": item.unit,
            "allocated_qty": allocated,
            "total_estimated": estimated,
            "remaining": remaining,
            "status": inv_status,
        })

    return {"po_id": str(po_id), "po_number": po.po_number, "po_status": po.status.value, "items": result}
