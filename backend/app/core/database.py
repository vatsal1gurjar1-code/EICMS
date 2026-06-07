"""
app/core/database.py
────────────────────
Sets up the SQLAlchemy database engine and session factory.

WHAT IS SQLALCHEMY?
  SQLAlchemy is a Python library that lets you work with the database
  using Python code instead of writing raw SQL queries.
  Instead of: SELECT * FROM users WHERE id = 1
  You write:  db.query(User).filter(User.id == 1).first()

WHAT IS A SESSION?
  A session is like a temporary "workspace" for database operations.
  You open a session, do your reads/writes, then close it.
  Each API request gets its own session (via get_db dependency).

ROW-LEVEL SECURITY (RLS):
  After every connection is made, we run:
    SET app.current_org_id = '<org_id>'
    SET app.current_user_role = '<role>'
  PostgreSQL RLS policies use these settings to automatically filter
  rows to the current user's organisation — even if the application
  code forgets to filter.
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from app.core.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────
# The engine is the core connection to PostgreSQL.
# pool_pre_ping=True checks that connections are alive before using them.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)


# ── Session Factory ───────────────────────────────────────────────────────────
# SessionLocal is the factory that creates new database sessions.
# autocommit=False means we must explicitly call db.commit() to save changes.
# autoflush=False means changes are not sent to the DB until we flush or commit.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ── Base Class ────────────────────────────────────────────────────────────────
# All database models (tables) inherit from this Base class.
# SQLAlchemy uses it to track all defined models.
class Base(DeclarativeBase):
    pass


# ── Dependency: get_db ────────────────────────────────────────────────────────
def get_db():
    """
    FastAPI dependency that provides a database session to each API endpoint.

    Usage in a route:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...

    The 'yield' means:
      - Before yield: open the session and give it to the route
      - After yield: close the session (even if an error occurred)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── RLS Context Setter ────────────────────────────────────────────────────────
def set_rls_context(db, org_id: str | None, role: str | None):
    """
    Sets PostgreSQL session variables used by Row-Level Security policies.
    Call this at the start of every authenticated API request.

    PostgreSQL RLS policies check:
      current_setting('app.current_org_id')
      current_setting('app.current_user_role')

    This ensures data from one organisation is NEVER visible to another,
    enforced at the database engine level — independent of application code.
    """
    db.execute(text(f"SET app.current_org_id = '{org_id or ''}'"))
    db.execute(text(f"SET app.current_user_role = '{role or ''}'"))
    db.execute(text(f"SET app.current_org_id = '{org_id or ''}'"))
    db.execute(text(f"SET app.current_user_role = '{role or ''}'"))
