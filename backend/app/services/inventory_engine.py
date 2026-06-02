"""app/services/inventory_engine.py"""
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from app.models.po_schedule_b_item import POScheduleBItem
from app.models.manager_estimate import ManagerEstimate
from app.models.alert import Alert, AlertType
from app.models.user import User, UserRole
from app.models.purchase_order import PurchaseOrder
from app.services.email_service import EmailService

class InventoryEngine:
    @staticmethod
    def check_shortage(db: Session, item_id: uuid.UUID, org_id: uuid.UUID):
        item = db.query(POScheduleBItem).filter(POScheduleBItem.id == item_id).first()
        if not item:
            return

        total_est = db.query(func.coalesce(func.sum(ManagerEstimate.estimated_qty), 0)).filter(
            ManagerEstimate.po_schedule_b_item_id == item.id
        ).scalar()
        
        allocated = float(item.allocated_qty)
        estimated = float(total_est)
        
        if estimated > allocated:
            shortage_amount = estimated - allocated
            
            # Check if an alert already exists for this exact item shortage
            existing_alert = db.query(Alert).filter(
                Alert.org_id == org_id,
                Alert.alert_type == AlertType.SHORTAGE,
                Alert.context['item_id'].astext == str(item_id)
            ).first()
            
            if not existing_alert:
                po = db.query(PurchaseOrder).filter(PurchaseOrder.id == item.po_id).first()
                
                new_alert = Alert(
                    org_id=org_id,
                    alert_type=AlertType.SHORTAGE,
                    message=f"Shortage of {shortage_amount} {item.unit} for item {item.item_code}",
                    context={"item_id": str(item_id), "po_id": str(po.id), "shortage_amount": shortage_amount}
                )
                db.add(new_alert)
                db.commit()
                
                admins = db.query(User).filter(User.org_id == org_id, User.role == UserRole.ORG_ADMIN).all()
                for admin in admins:
                    EmailService.send_shortage_alert(admin.email, item.item_code, shortage_amount, po.po_number)
                    
    @staticmethod
    def check_surplus(db: Session, po_id: uuid.UUID, org_id: uuid.UUID):
        items = db.query(POScheduleBItem).filter(POScheduleBItem.po_id == po_id).all()
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
        if not po:
            return
            
        for item in items:
            total_est = db.query(func.coalesce(func.sum(ManagerEstimate.estimated_qty), 0)).filter(
                ManagerEstimate.po_schedule_b_item_id == item.id
            ).scalar()
            
            allocated = float(item.allocated_qty)
            estimated = float(total_est)
            
            if estimated < allocated:
                surplus_amount = allocated - estimated
                
                existing_alert = db.query(Alert).filter(
                    Alert.org_id == org_id,
                    Alert.alert_type == AlertType.SURPLUS,
                    Alert.context['item_id'].astext == str(item.id)
                ).first()
                
                if not existing_alert:
                    new_alert = Alert(
                        org_id=org_id,
                        alert_type=AlertType.SURPLUS,
                        message=f"Surplus of {surplus_amount} {item.unit} for item {item.item_code}",
                        context={"item_id": str(item.id), "po_id": str(po_id), "surplus_amount": surplus_amount}
                    )
                    db.add(new_alert)
                    
                    admins = db.query(User).filter(User.org_id == org_id, User.role == UserRole.ORG_ADMIN).all()
                    for admin in admins:
                        EmailService.send_surplus_alert(admin.email, item.item_code, surplus_amount, po.po_number)
                        
        db.commit()
