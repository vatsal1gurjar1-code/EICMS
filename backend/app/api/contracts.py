"""
app/api/contracts.py — Contract Management Routes
───────────────────────────────────────────────────
Full CRUD for POs, Release Numbers, Sites, Schedule B items, and Item Catalog.
Includes both manual entry and CSV upload for Schedule B.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid, csv, io
from decimal import Decimal

from app.core.database import get_db
from app.core.security import require_role
from app.models.purchase_order import PurchaseOrder, POStatus
from app.models.release_number import ReleaseNumber
from app.models.site import Site, SiteStatus
from app.models.item_catalog import ItemCatalog
from app.models.po_schedule_b_item import POScheduleBItem

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────
class CreatePORequest(BaseModel):
    po_number: str
    tender_id: Optional[str] = None
    description: Optional[str] = None
    order_value: Optional[Decimal] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class CreateReleaseRequest(BaseModel):
    release_no: str
    description: Optional[str] = None


class CreateSiteRequest(BaseModel):
    site_no: str
    location: Optional[str] = None
    area: Optional[str] = None


class CreateScheduleBItemRequest(BaseModel):
    item_code: str
    description: str
    unit: str
    allocated_qty: Decimal
    locked_rate: Optional[Decimal] = None
    sort_order: Optional[int] = 0


class CreateCatalogItemRequest(BaseModel):
    item_code: str
    description: str
    unit: str
    current_rate: Optional[Decimal] = None


# ── Purchase Orders ──────────────────────────────────────────────────────────
@router.get("")
def list_pos(current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """List all Purchase Orders for the current organisation."""
    pos = db.query(PurchaseOrder).filter(PurchaseOrder.org_id == current_user.org_id).all()
    return [{"id": str(p.id), "po_number": p.po_number, "tender_id": p.tender_id,
             "status": p.status.value, "order_value": str(p.order_value or 0)} for p in pos]


@router.post("", status_code=201)
def create_po(body: CreatePORequest, current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Create a new Purchase Order."""
    po = PurchaseOrder(org_id=current_user.org_id, created_by=current_user.id, **body.model_dump())
    db.add(po)
    db.commit()
    db.refresh(po)
    return {"id": str(po.id), "po_number": po.po_number, "status": po.status.value}


@router.get("/{po_id}")
def get_po(po_id: uuid.UUID, current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Get full details of a Purchase Order including release numbers and sites."""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id, PurchaseOrder.org_id == current_user.org_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found.")
    return {
        "id": str(po.id), "po_number": po.po_number, "tender_id": po.tender_id,
        "description": po.description, "status": po.status.value, "order_value": str(po.order_value or 0),
        "release_numbers": [
            {"id": str(r.id), "release_no": r.release_no,
             "sites": [{"id": str(s.id), "site_no": s.site_no, "status": s.status.value, "location": s.location} for s in r.sites]}
            for r in po.release_numbers
        ],
        "schedule_b_items": [
            {"id": str(i.id), "item_code": i.item_code, "description": i.description,
             "unit": i.unit, "allocated_qty": str(i.allocated_qty), "locked_rate": str(i.locked_rate or 0),
             "sort_order": i.sort_order}
            for i in sorted(po.schedule_b_items, key=lambda x: x.sort_order)
        ],
    }


# ── Release Numbers ──────────────────────────────────────────────────────────
@router.post("/{po_id}/releases", status_code=201)
def create_release(po_id: uuid.UUID, body: CreateReleaseRequest,
                   current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Add a Release Number to a PO."""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id, PurchaseOrder.org_id == current_user.org_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found.")
    release = ReleaseNumber(org_id=current_user.org_id, po_id=po_id, **body.model_dump())
    db.add(release)
    db.commit()
    db.refresh(release)
    return {"id": str(release.id), "release_no": release.release_no}


# ── Sites ────────────────────────────────────────────────────────────────────
@router.post("/{po_id}/releases/{release_id}/sites", status_code=201)
def create_site(po_id: uuid.UUID, release_id: uuid.UUID, body: CreateSiteRequest,
                current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Add a Site to a Release Number."""
    release = db.query(ReleaseNumber).filter(ReleaseNumber.id == release_id, ReleaseNumber.org_id == current_user.org_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release Number not found.")
    site = Site(org_id=current_user.org_id, release_id=release_id, **body.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return {"id": str(site.id), "site_no": site.site_no, "status": site.status.value}


# ── Schedule B Items — Manual Entry ─────────────────────────────────────────
@router.post("/{po_id}/schedule-b", status_code=201)
def add_schedule_b_item(po_id: uuid.UUID, body: CreateScheduleBItemRequest,
                         current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Manually add a single Schedule B item to a PO."""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id, PurchaseOrder.org_id == current_user.org_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found.")
    item = POScheduleBItem(org_id=current_user.org_id, po_id=po_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": str(item.id), "item_code": item.item_code, "allocated_qty": str(item.allocated_qty)}


# ── Schedule B — CSV Upload ──────────────────────────────────────────────────
@router.post("/{po_id}/schedule-b/upload", status_code=201)
async def upload_schedule_b_csv(
    po_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user=Depends(require_role("super_admin", "org_admin")),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV file to bulk-insert Schedule B items.

    Expected CSV columns (header row required):
      item_code, description, unit, allocated_qty, locked_rate (optional)

    Example:
      item_code,description,unit,allocated_qty,locked_rate
      HT-001,HT Line Stringing,KM,25.5,1500.00
      LT-001,LT Line Stringing,KM,40.0,800.00
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id, PurchaseOrder.org_id == current_user.org_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found.")

    contents = await file.read()
    text = contents.decode("utf-8-sig")  # utf-8-sig handles Excel's BOM character
    reader = csv.DictReader(io.StringIO(text))

    required_columns = {"item_code", "description", "unit", "allocated_qty"}
    if not required_columns.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must have these columns: {', '.join(required_columns)}"
        )

    items_created = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            item = POScheduleBItem(
                org_id=current_user.org_id,
                po_id=po_id,
                item_code=row["item_code"].strip(),
                description=row["description"].strip(),
                unit=row["unit"].strip(),
                allocated_qty=Decimal(row["allocated_qty"].strip()),
                locked_rate=Decimal(row["locked_rate"].strip()) if row.get("locked_rate", "").strip() else None,
                sort_order=row_num - 2,
            )
            db.add(item)
            items_created += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    if errors:
        db.rollback()
        raise HTTPException(status_code=400, detail={"message": "CSV parsing failed.", "errors": errors})

    db.commit()
    return {"message": f"Successfully imported {items_created} Schedule B items.", "items_created": items_created}


# ── Item Catalog ─────────────────────────────────────────────────────────────
@router.get("/catalog")
def list_catalog(current_user=Depends(require_role("org_admin", "manager")), db: Session = Depends(get_db)):
    """List all items in the organisation's item catalog."""
    items = db.query(ItemCatalog).filter(ItemCatalog.org_id == current_user.org_id, ItemCatalog.is_active == True).all()
    return [{"id": str(i.id), "item_code": i.item_code, "description": i.description,
             "unit": i.unit, "current_rate": str(i.current_rate or 0)} for i in items]


@router.post("/catalog", status_code=201)
def create_catalog_item(body: CreateCatalogItemRequest,
                         current_user=Depends(require_role("super_admin", "org_admin")), db: Session = Depends(get_db)):
    """Add an item to the organisation's item catalog."""
    item = ItemCatalog(org_id=current_user.org_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": str(item.id), "item_code": item.item_code}
