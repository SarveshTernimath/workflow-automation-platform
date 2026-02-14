import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models.user import User, Role
from app.db.models.workflow import Workflow
from app.core import security

import uuid

def get_admin_token(client: TestClient, db: Session):
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(name="admin")
        db.add(admin_role)
        db.flush()
    
    password = "password123"
    username = f"admin_{uuid.uuid4().hex[:8]}"
    email = f"{username}@test.com"
    
    user = User(
        email=email,
        username=username,
        full_name="Admin User",
        hashed_password=security.get_password_hash(password),
        is_active=True,
    )
    user.roles = [admin_role]
    db.add(user)
    db.flush()
    
    login_data = {"username": email, "password": password}
    r = client.post(f"{settings.API_V1_PREFIX}/login/access-token", data=login_data)
    return r.json()["access_token"]

def test_create_workflow(client: TestClient, db: Session, override_get_db):
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    
    workflow_data = {
        "name": "Test Workflow",
        "description": "A workflow for integration testing",
        "is_active": True
    }
    
    response = client.post(
        f"{settings.API_V1_PREFIX}/workflows/",
        json=workflow_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == workflow_data["name"]
    assert "id" in data

def test_list_workflows(client: TestClient, db: Session, override_get_db):
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a workflow first
    workflow = Workflow(name="List Test Workflow", description="Test", created_by=None)
    db.add(workflow)
    db.flush()
    
    response = client.get(f"{settings.API_V1_PREFIX}/workflows/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

def test_get_workflow(client: TestClient, db: Session, override_get_db):
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    
    workflow = Workflow(name="Get Test Workflow", description="Test", created_by=None)
    db.add(workflow)
    db.flush()
    
    response = client.get(f"{settings.API_V1_PREFIX}/workflows/{workflow.id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Get Test Workflow"

def test_update_workflow(client: TestClient, db: Session, override_get_db):
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    
    workflow = Workflow(name="Update Test Workflow", description="Old Description", created_by=None)
    db.add(workflow)
    db.flush()
    
    update_data = {"description": "New Description"}
    response = client.put(
        f"{settings.API_V1_PREFIX}/workflows/{workflow.id}",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    assert response.json()["description"] == "New Description"

def test_delete_workflow(client: TestClient, db: Session, override_get_db):
    token = get_admin_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    
    workflow = Workflow(name="Delete Test Workflow", description="Test", created_by=None)
    db.add(workflow)
    db.flush()
    
    response = client.delete(f"{settings.API_V1_PREFIX}/workflows/{workflow.id}", headers=headers)
    assert response.status_code == 204
    
    # Verify deletion
    assert db.query(Workflow).filter(Workflow.id == workflow.id).first() is None
