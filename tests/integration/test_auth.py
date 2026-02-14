import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.models.user import User, Role


def create_test_user(db: Session) -> User:
    role = db.query(Role).filter(Role.name == "admin").first()
    if not role:
        role = Role(name="admin")
        db.add(role)
        db.flush()
        
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
    )
    user.roles = [role]
    db.add(user)
    db.flush()
    return user


def test_login_access_token(client: TestClient, db: Session, override_get_db):
    create_test_user(db)

    login_data = {
        "username": "test@example.com",
        "password": "password123",
    }
    r = client.post(f"{settings.API_V1_PREFIX}/login/access-token", data=login_data)
    tokens = r.json()
    assert r.status_code == 200
    assert "access_token" in tokens
    assert tokens["access_token"]


def test_use_access_token(client: TestClient, db: Session, override_get_db):
    user = create_test_user(db)

    login_data = {
        "username": "test@example.com",
        "password": "password123",
    }
    r = client.post(f"{settings.API_V1_PREFIX}/login/access-token", data=login_data)
    token = r.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    r = client.get(f"{settings.API_V1_PREFIX}/users/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


def test_login_incorrect_password(client: TestClient, db: Session, override_get_db):
    create_test_user(db)

    login_data = {
        "username": "test@example.com",
        "password": "wrongpassword",
    }
    r = client.post(f"{settings.API_V1_PREFIX}/login/access-token", data=login_data)
    assert r.status_code == 400
    assert "Incorrect email or password" in r.json()["detail"]
