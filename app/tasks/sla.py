"""
SLA Monitoring Tasks
Responsibility: Periodic background execution of SLA checks
"""

import logging
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.sla_monitor import SLAMonitor

logger = logging.getLogger("workflow-platform.tasks")


@celery_app.task(name="app.tasks.sla.check_all_slas")
def check_all_slas():
    """
    Periodic task to scan for SLA breaches.
    """
    logger.info("Starting periodic SLA scan...")
    db = SessionLocal()
    try:
        count = SLAMonitor.scan_for_breaches(db)
        if count > 0:
            logger.info(f"SLA Scan complete. Detected {count} new breaches.")
        else:
            logger.debug("SLA Scan complete. No new breaches.")
        return count
    except Exception as e:
        logger.error(f"Error during periodic SLA scan: {e}")
        return 0
    finally:
        db.close()
