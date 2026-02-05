import logging
import sys
from typing import Any, Dict
import json
from datetime import datetime
from app.core.config import settings


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter to output logs in a structured JSON format.
    Ideal for log aggregators like Datadog, ELK, or CloudWatch.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "funcName": record.funcName,
            "line": record.lineno,
        }

        # Include extra fields if provided
        if hasattr(record, "extra_info"):
            log_entry["extra_info"] = record.extra_info

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging():
    """
    Configures the root logger with a structured JSON formatter for production
    and a readable format for development.
    """
    root_logger = logging.getLogger()

    # Clear existing handlers
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)

    if settings.ENVIRONMENT == "production":
        formatter = StructuredFormatter()
    else:
        # Readable format for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO if not settings.DEBUG else logging.DEBUG)

    # Disable noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# Initialize logging immediately
setup_logging()
logger = logging.getLogger("workflow-platform")
