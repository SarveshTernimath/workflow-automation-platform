from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.db.models.user import User
from app.schemas.request import (
    WorkflowRequestCreate,
    WorkflowRequestSchema,
    RequestStepSchema,
)
from app.services.workflow_engine import WorkflowEngine

router = APIRouter()


@router.get("/", response_model=List[WorkflowRequestSchema])
def read_requests(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    requester_id: str = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve workflow requests with optional filtering.
    """
    from app.db.models.request import WorkflowRequest, RequestStatus

    query = db.query(WorkflowRequest)
    
    # Filter by status if provided
    if status:
        try:
            status_enum = RequestStatus[status.upper()]
            query = query.filter(WorkflowRequest.status == status_enum)
        except KeyError:
            pass  # Invalid status, ignore filter
    
    # Filter by requester if provided
    if requester_id:
        try:
            import uuid
            req_uuid = uuid.UUID(requester_id)
            query = query.filter(WorkflowRequest.requester_id == req_uuid)
        except ValueError:
            pass  # Invalid UUID, ignore filter
    
    requests = query.order_by(WorkflowRequest.created_at.desc()).offset(skip).limit(limit).all()
    return requests


@router.get("/my-tasks", response_model=List[Dict[str, Any]])
def get_my_tasks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get pending workflow steps assigned to the current user.
    Returns tasks where the user has the required role/permission.
    """
    from app.db.models.request import WorkflowRequest, RequestStep, StepStatus
    from app.db.models.workflow import WorkflowStep
    
    # Find all pending steps where user has required role or permission
    user_role_ids = {role.id for role in current_user.roles}
    user_permission_ids = set()
    is_admin = False
    
    for role in current_user.roles:
        if role.name.lower() == "admin":
            is_admin = True
        for perm in role.permissions:
            user_permission_ids.add(perm.id)
    
    # Get pending request steps
    pending_steps = (
        db.query(RequestStep)
        .join(WorkflowStep, RequestStep.step_id == WorkflowStep.id)
        .join(WorkflowRequest, RequestStep.request_id == WorkflowRequest.id)
        .filter(
            RequestStep.status == StepStatus.PENDING,
            RequestStep.completed_at == None,
        )
        .all()
    )
    
    # Filter by RBAC
    tasks = []
    for step in pending_steps:
        step_def = step.step
        
        # Admin Override: Bypass checks if user is admin
        if not is_admin:
            # Check if user has required role
            if step_def.required_role_id and step_def.required_role_id not in user_role_ids:
                continue
            # Check if user has required permission
            if step_def.required_permission_id and step_def.required_permission_id not in user_permission_ids:
                continue
        
        tasks.append({
            "request_id": str(step.request_id),
            "request_step_id": str(step.id),
            "workflow_name": step.request.workflow.name,
            "step_name": step_def.name,
            "step_description": step_def.description,
            "deadline": step.deadline.isoformat() if step.deadline else None,
            "is_sla_breached": step.is_sla_breached,
            "request_data": step.request.request_data,
            "created_at": step.request.created_at.isoformat(),
        })
    
    return tasks


@router.get("/stats", response_model=Dict[str, int])
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get summary stats for the dashboard.
    """
    from app.db.models.request import WorkflowRequest, RequestStatus, RequestStep, StepStatus

    active = db.query(WorkflowRequest).filter(WorkflowRequest.status == RequestStatus.IN_PROGRESS).count()
    completed = db.query(WorkflowRequest).filter(WorkflowRequest.status == RequestStatus.COMPLETED).count()
    pending_tasks = db.query(RequestStep).filter(RequestStep.status == StepStatus.PENDING).count()
    sla_breaches = db.query(RequestStep).filter(RequestStep.is_sla_breached == True).count()

    return {
        "active": active,
        "completed": completed,
        "pending": pending_tasks,
        "overdue": sla_breaches
    }


@router.post("/", response_model=WorkflowRequestSchema)
def start_workflow(
    *,
    db: Session = Depends(deps.get_db),
    request_in: WorkflowRequestCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Initiate a new workflow request.
    """
    request = WorkflowEngine.start_workflow(
        db, request_in.workflow_id, current_user.id, request_in.request_data or {}
    )
    db.commit()
    db.refresh(request)
    return request


@router.post("/{id}/process", response_model=WorkflowRequestSchema)
def process_request_step(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    outcome: str = Body(..., embed=True),
    context: Dict[str, Any] = Body(None, embed=True),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Process the current step of a workflow request.
    """
    request = WorkflowEngine.process_step(db, id, current_user, outcome, context)
    db.commit()
    db.refresh(request)
    return request


@router.get("/{id}", response_model=WorkflowRequestSchema)
def read_request(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get workflow request by ID.
    """
    from app.db.models.request import WorkflowRequest

    request = db.query(WorkflowRequest).filter(WorkflowRequest.id == id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request
