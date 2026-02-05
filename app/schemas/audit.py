from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


# Schema for Audit Log
class AuditLogSchema(BaseModel):
    id: UUID
    request_id: Optional[UUID] = None
    actor_id: Optional[UUID] = None
    action: str
    resource_type: str
    resource_id: str
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime
    meta_data: Optional[dict] = None

    class Config:
        from_attributes = True


# Schema for SLA Escalation
class SLAEscalationSchema(BaseModel):
    id: UUID
    request_step_id: UUID
    escalated_to: Optional[UUID] = None
    escalated_at: datetime
    escalation_level: int
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    class Config:
        from_attributes = True
