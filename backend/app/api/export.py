import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import openpyxl

from app.core.database import get_db
from app.core.security import require_role
from app.models.purchase_order import PurchaseOrder
from app.models.po_schedule_b_item import POScheduleBItem

from app.models.manager_estimate import ManagerEstimate
from sqlalchemy import func

router = APIRouter()

@router.get("/inventory")
def export_inventory(
    current_user=Depends(require_role("super_admin", "org_admin")),
    db: Session = Depends(get_db),
):
    # Create an Excel workbook in memory
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Inventory Report"
    
    # Headers
    headers = ["PO Number", "Tender ID", "Item Code", "Description", "Unit", "Allocated Qty", "Estimated Qty", "Remaining Qty", "Status"]
    ws.append(headers)
    
    # Fetch Data
    pos = db.query(PurchaseOrder).filter(PurchaseOrder.org_id == current_user.org_id).all()
    
    for po in pos:
        for item in po.schedule_b_items:
            allocated = float(item.allocated_qty)
            
            item_est = db.query(func.coalesce(func.sum(ManagerEstimate.estimated_qty), 0)).filter(
                ManagerEstimate.po_schedule_b_item_id == item.id
            ).scalar() or 0
            
            estimated = float(item_est)
            remaining = allocated - estimated
            
            status = "OK"
            if remaining < 0:
                status = "SHORTAGE"
            elif po.status == "completed" and remaining > 0:
                status = "SURPLUS"
                
            row = [
                po.po_number,
                po.tender_id or "-",
                item.item_code,
                item.description,
                item.unit,
                allocated,
                estimated,
                remaining,
                status
            ]
            ws.append(row)
            
    # Format headers to bold
    for cell in ws[1]:
        cell.font = openpyxl.styles.Font(bold=True)
        
    # Save to memory stream
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    return StreamingResponse(
        stream, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Inventory_Report.xlsx"'}
    )
