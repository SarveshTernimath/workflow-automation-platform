"""
Notification Service
Responsibility: Prepare and send automated notifications
"""

import os
import logging
import smtplib
from email.message import EmailMessage
from typing import Dict, Any, List
from jinja2 import Environment, FileSystemLoader
from app.core.config import settings

logger = logging.getLogger("workflow-platform.notification")


class NotificationService:
    _template_env = Environment(
        loader=FileSystemLoader(
            os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "templates", "email"
            )
        )
    )

    @staticmethod
    def send_email(
        to_email: str, subject: str, template_name: str, context: Dict[str, Any]
    ):
        """
        Render a template and send an email via SMTP.
        """
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning(
                f"SMTP not configured. Skipping email to {to_email} with subject '{subject}'."
            )
            return

        try:
            template = NotificationService._template_env.get_template(template_name)
            html_content = template.render(**context)

            msg = EmailMessage()
            msg.set_content("HTML email requires an HTML-capable viewer.")
            msg.add_alternative(html_content, subtype="html")
            msg["Subject"] = subject
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = to_email

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            raise

    @staticmethod
    def notify_task_assigned(
        email: str, workflow_name: str, step_name: str, request_id: str, deadline: str
    ):
        """
        Queuable logic for task assignment notification.
        """
        context = {
            "workflow_name": workflow_name,
            "step_name": step_name,
            "request_id": request_id,
            "deadline": deadline,
            "action_url": f"{settings.FRONTEND_URL}/requests/{request_id}",
        }
        NotificationService.send_email(
            to_email=email,
            subject=f"Task Assignment: {workflow_name}",
            template_name="task_assigned.html",
            context=context,
        )

    @staticmethod
    def notify_sla_breach(
        emails: List[str],
        workflow_name: str,
        step_name: str,
        request_id: str,
        deadline: str,
    ):
        """
        Queuable logic for SLA breach notification.
        """
        context = {
            "workflow_name": workflow_name,
            "step_name": step_name,
            "request_id": request_id,
            "deadline": deadline,
        }
        for email in emails:
            NotificationService.send_email(
                to_email=email,
                subject=f"URGENT: SLA Breach - {workflow_name}",
                template_name="sla_breach.html",
                context=context,
            )
