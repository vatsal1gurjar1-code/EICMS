"""app/api/sites.py — Sites, Assignments & Estimates Routes (Phase 2 expanded)"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.site import Site, SiteStatus
from app.models.site_manager_assignment import SiteManagerAssignment

router = APIRouter()


class AssignManagerRequest(BaseModel):
    user_id: uuid.UUID


@router.post("/{site_id}/assign", status_code=201)
def assign_manager(site_id: uuid.UUID, body: AssignManagerRequest,
                   current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Assign a manager to a site."""
    site = db.query(Site).filter(Site.id == site_id, Site.org_id == current_user.org_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found.")

    assignment = SiteManagerAssignment(
        org_id=current_user.org_id,
        site_id=site_id,
        user_id=body.user_id,
        assigned_by=current_user.id,
        is_active=True,
    )
    db.add(assignment)
    db.commit()
    return {"message": "Manager assigned successfully."}


@router.delete("/{site_id}/assign/{user_id}")
def remove_manager(site_id: uuid.UUID, user_id: uuid.UUID,
                   current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Remove a manager from a site (soft delete — marks as inactive)."""
    assignment = db.query(SiteManagerAssignment).filter(
        SiteManagerAssignment.site_id == site_id,
        SiteManagerAssignment.user_id == user_id,
        SiteManagerAssignment.org_id == current_user.org_id,
        SiteManagerAssignment.is_active == True,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    assignment.is_active = False
    assignment.removed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Manager removed from site."}


@router.get("/my-sites")
def get_my_sites(current_user=Depends(require_role("manager")), db: Session = Depends(get_db)):
    """Manager gets all sites assigned to them."""
    assignments = db.query(SiteManagerAssignment).filter(
        SiteManagerAssignment.user_id == current_user.id,
        SiteManagerAssignment.is_active == True,
    ).all()
    sites = []
    for a in assignments:
        site = db.query(Site).filter(Site.id == a.site_id).first()
        if site:
            sites.append({
                "id": str(site.id),
                "site_no": site.site_no,
                "status": site.status.value,
                "location": site.location,
                "is_locked": site.is_locked,
            })
    return sites


@router.patch("/{site_id}/mark-complete")
def mark_site_complete(site_id: uuid.UUID,
                       current_user=Depends(require_role("manager")), db: Session = Depends(get_db)):
    """Manager marks a site as complete (pending Admin verification)."""
    site = db.query(Site).filter(Site.id == site_id, Site.org_id == current_user.org_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found.")
    if site.status != SiteStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Only active sites can be marked as complete.")

    site.status = SiteStatus.PENDING_VERIFICATION
    db.commit()
    return {"message": "Site marked as pending verification. Admin will review shortly."}

@router.patch("/{site_id}/verify")
def verify_site(site_id: uuid.UUID,
                current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Admin verifies a completed site."""
    from app.services.inventory_engine import InventoryEngine
    from app.models.release_number import ReleaseNumber

    site = db.query(Site).filter(Site.id == site_id, Site.org_id == current_user.org_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found.")
    if site.status != SiteStatus.PENDING_VERIFICATION:
        raise HTTPException(status_code=400, detail="Site must be pending verification.")

    site.status = SiteStatus.COMPLETED
    db.commit()

    # Trigger surplus check for the entire PO
    release = db.query(ReleaseNumber).filter(ReleaseNumber.id == site.release_id).first()
    if release:
        InventoryEngine.check_surplus(db, release.po_id, current_user.org_id)

    return {"message": "Site verified and closed."}

@router.patch("/{site_id}/reject")
def reject_site(site_id: uuid.UUID,
                current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Admin rejects a site, opening it back up for the manager."""
    site = db.query(Site).filter(Site.id == site_id, Site.org_id == current_user.org_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found.")
    if site.status != SiteStatus.PENDING_VERIFICATION:
        raise HTTPException(status_code=400, detail="Site must be pending verification.")

    site.status = SiteStatus.ACTIVE
    db.commit()
    return {"message": "Site rejected and returned to active."}

