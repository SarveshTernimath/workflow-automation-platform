"""
Application configuration
Responsibility: Load and validate environment variables, provide settings object
"""

from pydantic_settings import BaseSettings
from typing import Optional, Any, List


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses Pydantic for validation and type safety.
    """

    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/workflow_db"

    # Security Configuration
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://antigravity-frontend.onrender.com",
        "https://antigravtiy-frontend.onrender.com",
    ]

    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@workflow-platform.com"

    # Application Settings
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "Workflow Automation Platform"
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"
    ADMIN_EMAILS: List[str] = ["admin@workflow-platform.com"]

    class Config:
        # Load from .env file
        env_file = ".env"
        case_sensitive = True

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    def model_post_init(self, __context: Any) -> None:
        """
        Validate critical settings after initialization.
        """
        # Warn about SECRET_KEY in production, but don't crash yet
        if (
            self.is_production
            and self.SECRET_KEY == "your-secret-key-change-this-in-production"
        ):
            import logging
            logging.warning(
                "SECURITY WARNING: Default SECRET_KEY used in production! Change this in your environment variables."
            )

        # Render fixes: change postgres:// to postgresql://
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
        # Force sslmode=require for any non-localhost database
        if "localhost" not in self.DATABASE_URL and "127.0.0.1" not in self.DATABASE_URL:
            if "sslmode=" not in self.DATABASE_URL:
                separator = "&" if "?" in self.DATABASE_URL else "?"
                self.DATABASE_URL += f"{separator}sslmode=require"

        super().model_post_init(__context)


# Global settings instance
settings = Settings()
