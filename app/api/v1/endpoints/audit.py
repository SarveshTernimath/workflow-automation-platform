from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.db.models.user import User
from app.db.models.audit import AuditLog
from app.schemas.audit import AuditLogSchema

router = APIRouter()


@router.get("/", response_model=List[AuditLogSchema])
def read_audit_logs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    request_id: Optional[UUID] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve audit logs.
    """
    query = db.query(AuditLog)
    if request_id:
        query = query.filter(AuditLog.request_id == request_id)
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/{id}", response_model=AuditLogSchema)
def read_audit_log(
    *,
    db: Session = Depends(deps.get_db),
    id: UUID,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a specific audit log entry.
    """
    log = db.query(AuditLog).filter(AuditLog.id == id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log
