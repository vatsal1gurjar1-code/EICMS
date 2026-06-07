"""app/api/estimates.py"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from typing import List, Optional
from decimal import Decimal

from app.core.database import get_db
from app.core.security import require_role
from app.models.site import Site
from app.models.release_number import ReleaseNumber
from app.models.po_schedule_b_item import POScheduleBItem
from app.models.manager_estimate import ManagerEstimate
from app.models.site_manager_assignment import SiteManagerAssignment
from app.services.inventory_engine import InventoryEngine

router = APIRouter()

class EstimateInput(BaseModel):
    po_schedule_b_item_id: uuid.UUID
    estimated_qty: Decimal

class SubmitEstimatesRequest(BaseModel):
    estimates: List[EstimateInput]

@router.get("/{site_id}")
def get_site_estimates(site_id: uuid.UUID, current_user=Depends(require_role("manager", "org_admin")), db: Session = Depends(get_db)):
    """Get all Schedule B items for the site and the manager's current estimates."""
    if current_user.role.value == "manager":
        assignment = db.query(SiteManagerAssignment).filter(
            SiteManagerAssignment.site_id == site_id,
            SiteManagerAssignment.user_id == current_user.id,
            SiteManagerAssignment.is_active == True,
            SiteManagerAssignment.org_id == current_user.org_id
        ).first()
        
        if not assignment:
            raise HTTPException(status_code=403, detail="Not assigned to this site.")
        
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found.")
        
    release = db.query(ReleaseNumber).filter(ReleaseNumber.id == site.release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release number not found.")
    
    items = db.query(POScheduleBItem).filter(POScheduleBItem.po_id == release.po_id).order_by(POScheduleBItem.sort_order).all()
    
    existing_estimates = db.query(ManagerEstimate).filter(ManagerEstimate.site_id == site_id).all()
    est_dict = {str(e.po_schedule_b_item_id): e.estimated_qty for e in existing_estimates}
    
    result = []
    for item in items:
        result.append({
            "po_schedule_b_item_id": str(item.id),
            "item_code": item.item_code,
            "description": item.description,
            "unit": item.unit,
            "estimated_qty": float(est_dict.get(str(item.id), 0))
        })
        
    return {
        "site_id": str(site_id),
        "site_no": site.site_no,
        "status": site.status.value,
        "is_locked": site.is_locked,
        "items": result
    }

@router.put("/{site_id}")
def submit_site_estimates(site_id: uuid.UUID, body: SubmitEstimatesRequest, current_user=Depends(require_role("manager", "org_admin")), db: Session = Depends(get_db)):
    """Submit updated estimates for a site. Triggers shortage alerts if necessary."""
    if current_user.role.value == "manager":
        assignment = db.query(SiteManagerAssignment).filter(
            SiteManagerAssignment.site_id == site_id,
            SiteManagerAssignment.user_id == current_user.id,
            SiteManagerAssignment.is_active == True,
            SiteManagerAssignment.org_id == current_user.org_id
        ).first()
        
        if not assignment:
            raise HTTPException(status_code=403, detail="Not assigned to this site.")
        
    site = db.query(Site).filter(Site.id == site_id).first()
    if site.is_locked or site.status.value in ["completed", "pending_verification"]:
        raise HTTPException(status_code=400, detail="Site is locked and cannot be edited.")
        
    for est_in in body.estimates:
        existing = db.query(ManagerEstimate).filter(
            ManagerEstimate.site_id == site_id,
            ManagerEstimate.po_schedule_b_item_id == est_in.po_schedule_b_item_id
        ).first()
        
        if existing:
            existing.estimated_qty = est_in.estimated_qty
            existing.updated_at = None # let onupdate handle it
        else:
            new_est = ManagerEstimate(
                org_id=current_user.org_id,
                site_id=site_id,
                po_schedule_b_item_id=est_in.po_schedule_b_item_id,
                estimated_qty=est_in.estimated_qty,
                submitted_by=current_user.id
            )
            db.add(new_est)
            
    db.commit()
    
    # After transaction commit, trigger shortage checks
    for est_in in body.estimates:
        InventoryEngine.check_shortage(db, est_in.po_schedule_b_item_id, current_user.org_id)
        
    return {"message": "Estimates successfully updated."}
