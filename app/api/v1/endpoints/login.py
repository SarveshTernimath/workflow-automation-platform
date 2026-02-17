from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.models.user import User
from app.schemas.token import Token

router = APIRouter()


@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Authenticate user
    # Note: We don't have a CRUD service for user authentication yet, so doing it inline
    # or utilizing a simple query.
    # In a full app, we might have crud.user.authenticate(db, email, password)

    try:
        user = db.query(User).filter(User.email == form_data.username).first()

        if not user or not security.verify_password(
            form_data.password, user.hashed_password
        ):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"Login failed due to system error: {e}")
        raise HTTPException(status_code=500, detail="System Error during login")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Get primary role name
    primary_role = "user"
    if user.roles:
        primary_role = user.roles[0].name.lower()

    return {
        "access_token": security.create_access_token(
            subject=user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": primary_role
    }
