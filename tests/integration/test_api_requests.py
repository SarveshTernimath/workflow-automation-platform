import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models.user import User, Role
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.db.models.request import WorkflowRequest, RequestStatus, RequestStep, StepStatus
from app.core import security
import uuid
import traceback

def setup_orchestration_env(client: TestClient, db: Session):
    # 1. Create Roles
    admin_role = Role(name="admin")
    user_role = Role(name="user")
    db.add_all([admin_role, user_role])
    db.flush()
    
    # 2. Create Users
    password = "password123"
    admin_user = User(
        email="admin@test.com", username="admin", full_name="Admin",
        hashed_password=security.get_password_hash(password), is_active=True
    )
    db.add(admin_user)
    
    standard_user = User(
        email="user@test.com", username="user", full_name="User",
        hashed_password=security.get_password_hash(password), is_active=True
    )
    db.add(standard_user)
    db.flush()
    
    # Assign roles explicitly
    admin_user.roles = [admin_role]
    standard_user.roles = [user_role]
    db.flush()
    
    # 3. Create Workflow
    workflow = Workflow(name="Orchestration Test", description="Test", created_by=admin_user.id)
    db.add(workflow)
    db.flush()
    
    step1 = WorkflowStep(
        workflow_id=workflow.id, step_order=1, name="Step 1",
        required_role_id=user_role.id, sla_hours=24
    )
    step2 = WorkflowStep(
        workflow_id=workflow.id, step_order=2, name="Step 2",
        required_role_id=admin_role.id, sla_hours=24
    )
    db.add_all([step1, step2])
    db.flush()
    
    # Transition S1 -> S2 on APPROVED
    t1 = StepTransition(from_step_id=step1.id, to_step_id=step2.id, outcome="APPROVED")
    db.add(t1)
    db.flush()
    
    return {
        "admin_token": security.create_access_token(subject=str(admin_user.id)),
        "user_token": security.create_access_token(subject=str(standard_user.id)),
        "admin_user_id": admin_user.id,
        "standard_user_id": standard_user.id,
        "workflow_id": workflow.id,
        "step1_id": step1.id,
        "step2_id": step2.id
    }

def test_workflow_orchestration_cycle(client: TestClient, db: Session, override_get_db):
    try:
        env = setup_orchestration_env(client, db)
        
        # 1. Start Workflow (as standard user)
        headers = {"Authorization": f"Bearer {env['user_token']}"}
        start_data = {"workflow_id": str(env["workflow_id"]), "request_data": {"amount": 100}}
        r = client.post(f"{settings.API_V1_PREFIX}/requests/", json=start_data, headers=headers)
        assert r.status_code == 200
        request_id = r.json()["id"]
        assert r.json()["status"] == "IN_PROGRESS"
        
        # 2. Verify current step is Step 1 in my-tasks for user
        r = client.get(f"{settings.API_V1_PREFIX}/requests/my-tasks", headers=headers)
        assert r.status_code == 200
        tasks = r.json()
        assert any(t["request_id"] == str(request_id) and t["step_name"] == "Step 1" for t in tasks)
        
        # 3. Process Step 1 (as standard user) -> APPROVED (Moves to Step 2)
        proc_data = {"outcome": "APPROVED", "context": {"notes": "Approved step 1"}}
        r = client.post(f"{settings.API_V1_PREFIX}/requests/{request_id}/process", json=proc_data, headers=headers)
        assert r.status_code == 200
        assert r.json()["status"] == "IN_PROGRESS"
        
        # 4. Verify Step 1 is gone from user tasks and Step 2 is in admin tasks
        r = client.get(f"{settings.API_V1_PREFIX}/requests/my-tasks", headers=headers)
        assert not any(t["request_id"] == str(request_id) for t in r.json())
        
        admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}
        r = client.get(f"{settings.API_V1_PREFIX}/requests/my-tasks", headers=admin_headers)
        assert any(t["request_id"] == str(request_id) and t["step_name"] == "Step 2" for t in r.json())
        
        # 5. Process Step 2 (as admin) -> APPROVED (Moves to COMPLETED)
        r = client.post(f"{settings.API_V1_PREFIX}/requests/{request_id}/process", json=proc_data, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "COMPLETED"
    except Exception:
        traceback.print_exc()
        raise

def test_request_rbac_enforcement(client: TestClient, db: Session, override_get_db):
    try:
        env = setup_orchestration_env(client, db)
        
        # Start workflow
        headers = {"Authorization": f"Bearer {env['user_token']}"}
        start_data = {"workflow_id": str(env["workflow_id"]), "request_data": {"amount": 500}}
        r = client.post(f"{settings.API_V1_PREFIX}/requests/", json=start_data, headers=headers)
        request_id = r.json()["id"]
        
        admin_headers = {"Authorization": f"Bearer {env['admin_token']}"}
        proc_data = {"outcome": "APPROVED"}
        r = client.post(f"{settings.API_V1_PREFIX}/requests/{request_id}/process", json=proc_data, headers=admin_headers)
        
        # Since Admin doesn't have User role, it should fail with 403
        assert r.status_code == 403
        assert "User lacks required role" in r.json()["detail"]
    except Exception:
        traceback.print_exc()
        raise
