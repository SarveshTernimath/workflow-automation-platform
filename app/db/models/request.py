"""
Workflow request models
Responsibility: Define SQLAlchemy models for workflow instances/executions
Tables: workflow_requests, request_steps, request_state_history
"""

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text,
    Uuid,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.db.session import Base


class RequestStatus(str, enum.Enum):
    """Enum for workflow request status"""

    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    ESCALATED = "ESCALATED"


class StepStatus(str, enum.Enum):
    """Enum for request step status"""

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SKIPPED = "SKIPPED"


class WorkflowRequest(Base):
    """
    WorkflowRequest model - represents actual workflow instances (e.g., "John's Leave Request #123")

    Relationships:
        - Many-to-one with Workflow (template)
        - Many-to-one with User (requester)
        - Many-to-one with WorkflowStep (current_step)
        - One-to-many with RequestStep
        - One-to-many with RequestStateHistory
    """

    __tablename__ = "workflow_requests"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workflow_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requester_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    current_step_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="SET NULL"),
        nullable=True,
    )
    status = Column(
        SQLEnum(RequestStatus),
        default=RequestStatus.CREATED,
        nullable=False,
        index=True,
    )
    request_data = Column(
        JSON, nullable=True
    )  # Custom data for this request (e.g., {"leave_type": "sick", "days": 3})
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="requests")
    requester = relationship(
        "User", back_populates="workflow_requests", foreign_keys=[requester_id]
    )
    current_step = relationship("WorkflowStep", foreign_keys=[current_step_id])
    request_steps = relationship(
        "RequestStep", back_populates="request", cascade="all, delete-orphan"
    )
    state_history = relationship(
        "RequestStateHistory",
        back_populates="request",
        cascade="all, delete-orphan",
        order_by="RequestStateHistory.changed_at",
    )

    def __repr__(self):
        return f"<WorkflowRequest(id={self.id}, status={self.status}, workflow_id={self.workflow_id})>"


class RequestStep(Base):
    """
    RequestStep model - tracks execution of each step in a request

    Relationships:
        - Many-to-one with WorkflowRequest
        - Many-to-one with WorkflowStep (step definition)
        - Many-to-one with User (assigned_to)
        - One-to-many with SLAEscalation
    """

    __tablename__ = "request_steps"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    request_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(StepStatus), default=StepStatus.PENDING, nullable=False, index=True
    )
    assigned_to = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(
        DateTime(timezone=True), nullable=True, index=True
    )  # Pre-calculated SLA deadline
    is_sla_breached = Column(Boolean, default=False, nullable=False, index=True)
    comments = Column(Text, nullable=True)
    decision_data = Column(JSON, nullable=True)  # Custom decision data

    # Relationships
    request = relationship("WorkflowRequest", back_populates="request_steps")
    step = relationship("WorkflowStep", back_populates="request_steps")
    assignee = relationship("User", foreign_keys=[assigned_to])
    escalations = relationship(
        "SLAEscalation", back_populates="request_step", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<RequestStep(id={self.id}, status={self.status}, is_sla_breached={self.is_sla_breached})>"

    def __init__(self, **kwargs):
        """
        Explicit init to avoid potential SQLAlchemy mapping issues in tests.
        """
        for k, v in kwargs.items():
            setattr(self, k, v)


class RequestStateHistory(Base):
    """
    RequestStateHistory model - immutable log of state transitions for each request

    Relationships:
        - Many-to-one with WorkflowRequest
        - Many-to-one with User (changed_by)
    """

    __tablename__ = "request_state_history"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    request_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status = Column(
        SQLEnum(RequestStatus), nullable=True
    )  # Nullable for initial state
    to_status = Column(SQLEnum(RequestStatus), nullable=False)
    changed_by = Column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    changed_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    reason = Column(Text, nullable=True)
    meta_data = Column("metadata", JSON, nullable=True)

    # Relationships
    request = relationship("WorkflowRequest", back_populates="state_history")
    actor = relationship("User", foreign_keys=[changed_by])

    def __repr__(self):
        return f"<RequestStateHistory(id={self.id}, from_status={self.from_status}, to_status={self.to_status})>"
