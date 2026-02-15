from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.db.models.user import User
from app.schemas.workflow import WorkflowCreate, WorkflowSchema, WorkflowUpdate
from app.services.workflow_service import WorkflowService
from app.services.rbac import check_role

router = APIRouter()


@router.get("/", response_model=List[WorkflowSchema])
def read_workflows(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve workflows.
    """
    workflows = WorkflowService.list_workflows(db, skip=skip, limit=limit)
    return workflows


@router.post("/", response_model=WorkflowSchema)
def create_workflow(
    *,
    db: Session = Depends(deps.get_db),
    workflow_in: WorkflowCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new workflow (Admin only).
    """
    check_role(current_user, "admin")
    workflow = WorkflowService.create_workflow(
        db, workflow_in.model_dump(), current_user.id
    )
    return workflow


@router.get("/{id}", response_model=WorkflowSchema)
def read_workflow(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get workflow by ID.
    """
    return WorkflowService.get_workflow(db, id)


@router.delete("/{id}", status_code=204, response_class=Response, response_model=None)
def delete_workflow(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a workflow (Admin only).
    """
    check_role(current_user, "admin")
    WorkflowService.delete_workflow(db, id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
