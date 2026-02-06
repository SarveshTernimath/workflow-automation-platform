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
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

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
        # Ensure SECRET_KEY is changed in production
        if (
            self.is_production
            and self.SECRET_KEY == "your-secret-key-change-this-in-production"
        ):
        # Render fixes: change postgres:// to postgresql://
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

        super().model_post_init(__context)


# Global settings instance
settings = Settings()
