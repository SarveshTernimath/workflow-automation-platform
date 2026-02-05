"""
Audit Service
Responsibility: Centralized logic for creating audit logs
"""

import logging
from typing import Any, Dict, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.db.models.audit import AuditLog

logger = logging.getLogger("workflow-platform.audit_service")


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: str,
        actor_id: Optional[UUID] = None,
        request_id: Optional[UUID] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        meta_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Create a new audit log entry.
        """
        audit_entry = AuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            actor_id=actor_id,
            request_id=request_id,
            old_value=old_value,
            new_value=new_value,
            meta_data=meta_data,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit_entry)
        try:
            db.flush()  # Ensure it's valid before moving on, but don't commit yet
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            db.rollback()
            raise

        return audit_entry
