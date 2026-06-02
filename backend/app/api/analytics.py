from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import require_role
from app.models.purchase_order import PurchaseOrder
from app.models.site import Site
from app.models.po_schedule_b_item import POScheduleBItem

router = APIRouter()

from app.models.manager_estimate import ManagerEstimate

@router.get("")
def get_dashboard_analytics(
    current_user=Depends(require_role("super_admin", "org_admin")),
    db: Session = Depends(get_db),
):
    # PO Health Data
    po_health = []
    pos = db.query(PurchaseOrder).filter(PurchaseOrder.org_id == current_user.org_id).all()
    
    for po in pos:
        allocated = 0
        estimated = 0
        for item in po.schedule_b_items:
            item_est = db.query(func.coalesce(func.sum(ManagerEstimate.estimated_qty), 0)).filter(
                ManagerEstimate.po_schedule_b_item_id == item.id
            ).scalar() or 0
            allocated += float(item.allocated_qty)
            estimated += float(item_est)
        
        po_health.append({
            "name": po.po_number,
            "allocated": allocated,
            "used": estimated,
        })
        
    # Site Completion Status
    active_sites = db.query(Site).filter(Site.org_id == current_user.org_id, Site.status == 'active').count()
    pending_sites = db.query(Site).filter(Site.org_id == current_user.org_id, Site.status == 'pending_verification').count()
    completed_sites = db.query(Site).filter(Site.org_id == current_user.org_id, Site.status == 'completed').count()
    
    site_completion = [
        {"name": "Active", "value": active_sites, "fill": "#3b82f6"},
        {"name": "Pending", "value": pending_sites, "fill": "#eab308"},
        {"name": "Completed", "value": completed_sites, "fill": "#22c55e"},
    ]
    
    # Top Shortages Calculation
    items = db.query(POScheduleBItem).filter(POScheduleBItem.org_id == current_user.org_id).all()
    
    top_shortages = []
    for item in items:
        item_est = db.query(func.coalesce(func.sum(ManagerEstimate.estimated_qty), 0)).filter(
            ManagerEstimate.po_schedule_b_item_id == item.id
        ).scalar() or 0
        
        shortage_amt = float(item_est) - float(item.allocated_qty)
        if shortage_amt > 0:
            top_shortages.append({
                "name": item.item_code,
                "shortage": shortage_amt,
                "description": item.description
            })
        
    top_shortages = sorted(top_shortages, key=lambda x: x["shortage"], reverse=True)[:5]

    return {
        "poHealth": po_health,
        "siteCompletion": site_completion,
        "topShortages": top_shortages,
        "stats": {
            "totalPOs": len(pos),
            "totalSites": active_sites + pending_sites + completed_sites,
            "shortageCount": len(top_shortages)  # Re-use the list length
        }
    }
