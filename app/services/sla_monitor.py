"""
SLA Monitor Service
Responsibility: Detect SLA breaches and handle escalations
"""

import logging
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models.request import (
    RequestStep,
    StepStatus,
    WorkflowRequest,
    RequestStatus,
)
from app.db.models.audit import SLAEscalation
from app.services.audit_service import AuditService
from app.tasks.notifications import send_sla_breach_email

logger = logging.getLogger("workflow-platform.sla_monitor")


class SLAMonitor:
    @staticmethod
    def scan_for_breaches(db: Session) -> int:
        """
        Scan all active request steps that have passed their deadline.
        Returns the number of new breaches detected.
        """
        now = datetime.utcnow()

        # Find steps that are:
        # 1. PENDING or IN_PROGRESS
        # 2. Past their deadline
        # 3. Not already marked as breached
        overdue_steps = (
            db.query(RequestStep)
            .filter(
                RequestStep.status.in_([StepStatus.PENDING, StepStatus.IN_PROGRESS]),
                RequestStep.deadline < now,
                RequestStep.is_sla_breached == False,
            )
            .all()
        )

        breach_count = 0
        for step in overdue_steps:
            try:
                SLAMonitor._escalate_step(db, step)
                breach_count += 1
            except Exception as e:
                logger.error(f"Failed to escalate step {step.id}: {e}")

        if breach_count > 0:
            db.commit()

        return breach_count

    @staticmethod
    def _escalate_step(db: Session, step: RequestStep):
        """
        Mark a step as breached and record an escalation.
        """
        step.is_sla_breached = True

        # Create escalation record
        escalation = SLAEscalation(
            request_step_id=step.id,
            escalation_level=1,  # Initial level
            escalated_at=datetime.utcnow(),
        )
        db.add(escalation)

        AuditService.log_action(
            db,
            action="SLA_BREACH_DETECTED",
            resource_type="request_step",
            resource_id=str(step.id),
            request_id=step.request_id,
            meta_data={"deadline": step.deadline.isoformat()},
        )

        # Notify admins about breach
        send_sla_breach_email.delay(
            emails=settings.ADMIN_EMAILS,
            workflow_name=step.request.workflow.name,
            step_name=step.step.name,
            request_id=str(step.request_id),
            deadline=step.deadline.isoformat(),
        )

        logger.warning(
            f"SLA Breach detected for Request {step.request_id} at Step {step.step_id}"
        )
