from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from app.db.models.request import RequestStatus


# Schema for Request Step
class RequestStepSchema(BaseModel):
    id: UUID
    request_id: UUID
    step_id: UUID
    status: str
    actor_id: Optional[UUID] = None
    outcome: Optional[str] = None
    data: Optional[dict] = None
    deadline: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    # Added for visual view
    step_name: Optional[str] = None
    step_order: Optional[int] = None

    @classmethod
    def model_validate(cls, obj: Any, **kwargs):
        data = super().model_validate(obj, **kwargs)
        if hasattr(obj, 'step') and obj.step:
            data.step_name = obj.step.name
            data.step_order = obj.step.step_order
        return data

    class Config:
        from_attributes = True


# Schema for Workflow Request
class WorkflowRequestBase(BaseModel):
    workflow_id: UUID
    request_data: Optional[dict] = None


class WorkflowRequestCreate(WorkflowRequestBase):
    pass


class WorkflowRequestSchema(WorkflowRequestBase):
    id: UUID
    requester_id: UUID
    status: RequestStatus
    current_step_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    steps: List[RequestStepSchema] = []

    class Config:
        from_attributes = True


# Schema for Request State History
class RequestStateHistorySchema(BaseModel):
    id: UUID
    request_id: UUID
    from_status: str
    to_status: str
    changed_by: Optional[UUID] = None
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
