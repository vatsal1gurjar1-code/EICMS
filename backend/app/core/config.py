"""
app/core/config.py
──────────────────
Reads all environment variables from the .env file and makes them
available throughout the application as typed Python settings.

Using pydantic-settings means every variable is validated at startup.
If a required variable is missing, the app will refuse to start with
a clear error message — much better than crashing later.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Application ───────────────────────────────────────────────────────────
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str

    # ── JWT Authentication ────────────────────────────────────────────────────
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 8

    # ── Super Admin (seeded on first startup) ─────────────────────────────────
    super_admin_email: str
    super_admin_password: str

    # ── SendGrid (Email Alerts) ───────────────────────────────────────────────
    sendgrid_api_key: str = ""          # Empty string = emails logged to console only
    sendgrid_from_email: str = ""

    class Config:
        # Tell pydantic-settings to read from the .env file
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False          # DATABASE_URL and database_url both work


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    Using @lru_cache means the .env file is only read once,
    not on every API request.
    """
    return Settings()


# Convenient shortcut used throughout the app: from app.core.config import settings
settings = get_settings()
