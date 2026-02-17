"""
Celery configuration and app initialization
Responsibility: Setup background worker and periodic tasks
"""

import os
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "workflow_platform",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.sla", "app.tasks.notifications"]
)

# Optional configuration
# celery_app.conf.timezone = 'UTC'
# celery_app.conf.task_track_started = True

# Automated discovery is kept as a backup for future modules following standard naming
celery_app.autodiscover_tasks(["app.tasks"])

# Periodic task schedule (Beat)
celery_app.conf.beat_schedule = {
    "scan-sla-every-5-minutes": {
        "task": "app.tasks.sla.check_all_slas",
        "schedule": 300.0,  # Every 5 minutes
    },
}
