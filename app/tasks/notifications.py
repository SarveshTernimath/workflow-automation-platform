"""
Notification Tasks
Responsibility: Asynchronous execution of notification logic
"""

import logging
from typing import List, Optional
from uuid import UUID
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models.user import User, Role
from app.db.models.workflow import WorkflowStep
from app.services.notification import NotificationService

logger = logging.getLogger("workflow-platform.tasks")


@celery_app.task(name="app.tasks.notifications.notify_new_assignment")
def notify_new_assignment(
    step_id: UUID, request_id: UUID, workflow_name: str, step_name: str, deadline: str
):
    """
    Find eligible assignees and notify them of a new task.
    """
    db = SessionLocal()
    try:
        step_def = db.query(WorkflowStep).filter(WorkflowStep.id == step_id).first()
        if not step_def:
            return

        emails = []
        if step_def.required_role_id:
            users = (
                db.query(User)
                .join(User.roles)
                .filter(Role.id == step_def.required_role_id)
                .all()
            )
            emails = [u.email for u in users if u.is_active]

        if not emails:
            logger.info(
                f"No active users found for role in step {step_id}. Skipping notification."
            )
            return

        for email in emails:
            NotificationService.notify_task_assigned(
                email=email,
                workflow_name=workflow_name,
                step_name=step_name,
                request_id=str(request_id),
                deadline=deadline,
            )
        return len(emails)
    finally:
        db.close()


@celery_app.task(name="app.tasks.notifications.send_sla_breach_email")
def send_sla_breach_email(
    emails: List[str],
    workflow_name: str,
    step_name: str,
    request_id: str,
    deadline: str,
):
    """
    Background task to send SLA breach alerts.
    """
    logger.info(f"Triggering SLA breach alerts to {len(emails)} recipients")
    return NotificationService.notify_sla_breach(
        emails=emails,
        workflow_name=workflow_name,
        step_name=step_name,
        request_id=request_id,
        deadline=deadline,
    )
