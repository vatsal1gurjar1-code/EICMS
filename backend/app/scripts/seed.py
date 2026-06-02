import os
import sys

# Add the project root to the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        admin = db.query(User).filter_by(email="superadmin@eicms.local").first()
        if not admin:
            admin = User(
                email="superadmin@eicms.local",
                password_hash=hash_password("change_this_password_before_production"),
                role=UserRole.SUPER_ADMIN,
                full_name="Super Admin"
            )
            db.add(admin)
            db.commit()
            print("Created superadmin@eicms.local.")
        else:
            print("Admin already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
