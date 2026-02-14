from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models.user import User
from app.db.models.workflow import Workflow
from app.db.models.request import WorkflowRequest, RequestStep
from app.services.rbac import check_role

router = APIRouter()


@router.get("/")
def get_admin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get aggregate system-wide performance and volume metrics.
    Restricted to Administrative roles.
    """
    check_role(current_user, "admin")
    
    total_users = db.query(User).count()
    total_workflows = db.query(Workflow).count()
    total_requests = db.query(WorkflowRequest).count()
    sla_breaches = db.query(RequestStep).filter(RequestStep.is_sla_breached == True).count()
    
    return {
        "users": total_users,
        "workflows": total_workflows,
        "requests": total_requests,
        "sla_breaches": sla_breaches,
    }
