"""
Workflow definition models
Responsibility: Define SQLAlchemy models for workflow templates
Tables: workflows, workflow_steps, step_transitions
"""

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    Uuid,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base


class Workflow(Base):
    """
    Workflow model - represents workflow templates
    """

    __tablename__ = "workflows"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_by = Column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    steps = relationship(
        "WorkflowStep",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.step_order",
    )
    requests = relationship("WorkflowRequest", back_populates="workflow")

    def __repr__(self):
        return f"<Workflow(id={self.id}, name={self.name}, is_active={self.is_active})>"


class StepTransition(Base):
    """
    StepTransition model - defines valid transitions between steps
    """

    __tablename__ = "step_transitions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    from_step_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    to_step_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflow_steps.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    condition_config = Column(JSON, nullable=True)
    outcome = Column(String(50), nullable=False)

    # Relationships
    from_step = relationship(
        "WorkflowStep", back_populates="transitions_from", foreign_keys=[from_step_id]
    )
    to_step = relationship(
        "WorkflowStep", back_populates="transitions_to", foreign_keys=[to_step_id]
    )

    def __repr__(self):
        return f"<StepTransition(id={self.id}, from_step_id={self.from_step_id}, to_step_id={self.to_step_id})>"


class WorkflowStep(Base):
    """
    WorkflowStep model - represents steps in a workflow
    """

    __tablename__ = "workflow_steps"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workflow_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_order = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    required_role_id = Column(
        Uuid(as_uuid=True), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True
    )
    required_permission_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("permissions.id", ondelete="SET NULL"),
        nullable=True,
    )
    sla_hours = Column(Integer, nullable=False, default=24)
    is_conditional = Column(Boolean, default=False, nullable=False)
    condition_config = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    workflow = relationship("Workflow", back_populates="steps")
    required_role = relationship(
        "Role", back_populates="workflow_steps", foreign_keys=[required_role_id]
    )
    required_permission = relationship(
        "Permission",
        back_populates="workflow_steps",
        foreign_keys=[required_permission_id],
    )

    # Using explicit primaryjoin for transitions to resolve ambiguity
    transitions_from = relationship(
        "StepTransition",
        back_populates="from_step",
        primaryjoin="WorkflowStep.id == StepTransition.from_step_id",
        cascade="all, delete-orphan",
    )
    transitions_to = relationship(
        "StepTransition",
        back_populates="to_step",
        primaryjoin="WorkflowStep.id == StepTransition.to_step_id",
        cascade="all, delete-orphan",
    )

    request_steps = relationship("RequestStep", back_populates="step")

    def __repr__(self):
        return f"<WorkflowStep(id={self.id}, name={self.name}, step_order={self.step_order})>"
