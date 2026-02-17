from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.db.models.user import User
from app.services.workflow_engine import WorkflowEngine
from app.schemas.request import WorkflowRequestSchema
from app.core.exceptions import WorkflowEngineError, PermissionDeniedError
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/{id}", response_model=WorkflowRequestSchema)
@router.post("/{id}/decision", response_model=WorkflowRequestSchema)
def make_decision(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Execute a decision on a workflow instance step.
    Payload: { action: "approve" | "reject" | "execute", comment: string }
    """
    try:
        action = payload.get("action")
        comment = payload.get("comment")
        
        if not action:
            raise HTTPException(status_code=400, detail="Action is required (approve/reject/execute)")
            
        # Normalize action to uppercase to match transition outcomes (APPROVED, REJECTED)
        outcome = action.upper()
        
        # Prepare context
        context = {"comment": comment, "action": action}
        
        # process_step logic handles RBAC and state transitions
        request = WorkflowEngine.process_step(db, id, current_user, outcome, context)
        db.commit()
        db.refresh(request)
        return request
    except (WorkflowEngineError, PermissionDeniedError) as e:
        logger.warning(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Critical error in workflow execution: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
