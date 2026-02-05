from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


# Schema for Step Transition (Branching Logic)
class StepTransitionBase(BaseModel):
    from_step_id: UUID
    to_step_id: Optional[UUID] = None  # None means terminal
    condition_config: Optional[dict] = None
    outcome: str  # e.g., "APPROVED", "REJECTED"


class StepTransitionSchema(StepTransitionBase):
    id: UUID

    class Config:
        from_attributes = True


# Schema for Workflow Step
class WorkflowStepBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    step_order: int = Field(..., ge=1)
    sla_hours: int = Field(24, ge=1)
    required_role_id: Optional[UUID] = None
    required_permission_id: Optional[UUID] = None
    is_conditional: bool = False
    condition_config: Optional[dict] = None


class WorkflowStepCreate(WorkflowStepBase):
    pass


class WorkflowStepSchema(WorkflowStepBase):
    id: UUID
    workflow_id: UUID
    created_at: datetime
    transitions_from: List[StepTransitionSchema] = []

    class Config:
        from_attributes = True


# Schema for Workflow Definition
class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_active: bool = True


class StepTransitionCreate(BaseModel):
    from_step_order: int
    to_step_order: Optional[int] = None
    outcome: str
    condition_config: Optional[dict] = None


class WorkflowCreate(WorkflowBase):
    steps: List[WorkflowStepCreate] = []
    transitions: List[StepTransitionCreate] = []


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class WorkflowSchema(WorkflowBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepSchema] = []

    class Config:
        from_attributes = True


