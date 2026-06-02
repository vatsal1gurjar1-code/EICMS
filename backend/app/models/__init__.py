"""
app/models/__init__.py
──────────────────────
Imports all models so Alembic can discover them when generating migrations.
Every model file must be imported here.
"""

from app.models.organisation import Organisation
from app.models.user import User
from app.models.purchase_order import PurchaseOrder
from app.models.release_number import ReleaseNumber
from app.models.site import Site
from app.models.site_manager_assignment import SiteManagerAssignment
from app.models.item_catalog import ItemCatalog
from app.models.po_schedule_b_item import POScheduleBItem
from app.models.manager_estimate import ManagerEstimate
from app.models.alert import Alert
from app.models.audit_log import AuditLog

__all__ = [
    "Organisation",
    "User",
    "PurchaseOrder",
    "ReleaseNumber",
    "Site",
    "SiteManagerAssignment",
    "ItemCatalog",
    "POScheduleBItem",
    "ManagerEstimate",
    "Alert",
    "AuditLog",
]
