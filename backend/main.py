"""
main.py — FastAPI Application Entry Point
──────────────────────────────────────────
This is the first file that runs when the backend starts.
It creates the FastAPI app, registers all routes, and configures middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine
from app.models import *  # Import all models so Alembic knows about them


# ── Application Lifespan ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code here runs ONCE when the server starts (before handling any requests).
    Use it for startup tasks like seeding the database.
    """
    # Seed the Super Admin account if it doesn't exist
    await seed_super_admin()
    yield
    # Code after 'yield' runs when the server shuts down


async def seed_super_admin():
    """
    Creates the Super Admin account if it doesn't already exist.
    Credentials come from environment variables — never hardcoded.
    """
    from sqlalchemy.orm import Session
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(
            User.email == settings.super_admin_email,
            User.role == UserRole.SUPER_ADMIN,
        ).first()

        if not existing:
            super_admin = User(
                email=settings.super_admin_email,
                password_hash=hash_password(settings.super_admin_password),
                full_name="Super Admin",
                role=UserRole.SUPER_ADMIN,
                org_id=None,   # Super Admin is not scoped to any organisation
                is_active=True,
            )
            db.add(super_admin)
            db.commit()
            print(f"✅ Super Admin seeded: {settings.super_admin_email}")
        else:
            print(f"ℹ️  Super Admin already exists: {settings.super_admin_email}")
    except Exception as e:
        print(f"❌ Error seeding Super Admin: {e}")
        db.rollback()
    finally:
        db.close()


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="EICMS API",
    description="Electrical Infrastructure Contractor Management System — Backend API",
    version="1.0.0",
    docs_url="/docs",        # Swagger UI available at http://localhost:8000/docs
    redoc_url="/redoc",      # ReDoc UI available at http://localhost:8000/redoc
    lifespan=lifespan,
)


# ── CORS Middleware ───────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) controls which domains can make API calls.
# In development, we allow the Vite frontend at localhost:5173.
# In production, this is locked to the actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Route Registration ────────────────────────────────────────────────────────
# Import and register each API router
from app.api import auth, orgs, contracts, sites, inventory, alerts, estimates, analytics, export

app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(orgs.router,      prefix="/api/orgs",      tags=["Organisations & Users"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["Contracts & Schedule B"])
app.include_router(sites.router,     prefix="/api/sites",     tags=["Sites & Estimates"])
app.include_router(estimates.router, prefix="/api/estimates", tags=["Manager Estimates"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(alerts.router,    prefix="/api/alerts",    tags=["Alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(export.router,    prefix="/api/export",    tags=["Export"])


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """
    Simple endpoint to verify the API is running.
    Docker and hosting platforms use this to check if the service is alive.
    """
    return {"status": "ok", "version": "1.0.0"}
