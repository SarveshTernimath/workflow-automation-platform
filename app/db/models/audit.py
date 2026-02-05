"""
Audit log model
Responsibility: Define SQLAlchemy model for immutable audit logs and SLA escalations
Tables: audit_logs, sla_escalations
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Uuid, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base


class AuditLog(Base):
    """
    AuditLog model - immutable log of ALL system actions

    Relationships:
        - Many-to-one with User (actor)

    Note: This table does NOT support UPDATE or DELETE operations.
    Immutability is enforced at the application level.
    """

    __tablename__ = "audit_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    request_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    actor_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )  # Null for system actions
    action = Column(
        String(100), nullable=False, index=True
    )  # e.g., "workflow.create", "request.approve"
    resource_type = Column(
        String(50), nullable=False, index=True
    )  # e.g., "workflow", "request", "user"
    resource_id = Column(
        String(100), nullable=False, index=True
    )  # ID of affected resource
    old_value = Column(JSON, nullable=True)  # Previous state (for updates)
    new_value = Column(JSON, nullable=True)  # New state (for updates)
    ip_address = Column(String(45), nullable=True)  # Actor's IP address (supports IPv6)
    user_agent = Column(String(500), nullable=True)  # Actor's browser/client
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    meta_data = Column(JSON, nullable=True)  # Additional context

    # Relationships
    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, resource_type={self.resource_type}, resource_id={self.resource_id})>"


class SLAEscalation(Base):
    """
    SLAEscalation model - tracks escalations when SLAs are breached

    Relationships:
        - Many-to-one with RequestStep
        - Many-to-one with User (escalated_to)
    """

    __tablename__ = "sla_escalations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    request_step_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("request_steps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    escalated_to = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    escalated_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    escalation_level = Column(
        Integer, nullable=False, default=1
    )  # Escalation tier (1, 2, 3...)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    request_step = relationship("RequestStep", back_populates="escalations")
    escalated_user = relationship("User", foreign_keys=[escalated_to])

    def __repr__(self):
        return f"<SLAEscalation(id={self.id}, escalation_level={self.escalation_level}, resolved_at={self.resolved_at})>"
