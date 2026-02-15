"""
Dependency injection utilities
Responsibility: Provide reusable dependencies for route handlers
"""

from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.models.user import User
from app.schemas.token import TokenPayload
from app.services.rbac import check_permissions

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    Used with FastAPI's dependency injection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    """
    Validate JWT token and retrieve the current user.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    import uuid

    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    import logging
    logger = logging.getLogger("workflow-platform.auth")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    role_names = [r.name for r in user.roles]
    logger.info(f"Authenticated User: {user.email} | Roles: {role_names}")

    return user


class PermissionChecker:
    """
    Dependency for checking required permissions for a route.
    Usage:
        @router.get("/workflows", dependencies=[Depends(PermissionChecker(["workflow:view"]))])
    """

    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, user: User = Depends(get_current_user)) -> None:
        check_permissions(user, self.required_permissions)
