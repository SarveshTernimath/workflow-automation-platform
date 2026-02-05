import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4

from app.core import security
from app.core.config import settings
from app.db.models.user import User, Role, Permission
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.db.models.request import WorkflowRequest, RequestStatus, StepStatus


def create_test_user(db: Session, email: str, username: str) -> User:
    user = User(
        email=email,
        username=username,
        full_name="Test User",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


def get_auth_headers(client: TestClient, email: str) -> dict:
    login_data = {
        "username": email,
        "password": "password123",
    }
    r = client.post(f"{settings.API_V1_PREFIX}/login/access-token", data=login_data)
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_full_workflow_flow(client: TestClient, db: Session, override_get_db):
    # 1. Create Users
    emp = create_test_user(db, "emp@example.com", "emp")
    mgr = create_test_user(db, "mgr@example.com", "mgr")

    # Ensure Admin Role exists and assign to emp
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        admin_role = Role(name="Admin", description="Admin")
        db.add(admin_role)
        db.commit()
    
    emp.roles.append(admin_role)
    db.commit()

    auth_emp = get_auth_headers(client, "emp@example.com")
    auth_mgr = get_auth_headers(client, "mgr@example.com")

    # 2. Create Workflow Definition (via API)
    workflow_data = {
        "name": "Expenses",
        "description": "Expense approval workflow",
        "steps": [
            {"name": "Manager Review", "step_order": 1, "sla_hours": 24},
            {"name": "VP Approval", "step_order": 2, "sla_hours": 48},
        ],
        "transitions": [
            # If Manager approves and amount > 1000, go to VP
            {
                "from_step_order": 1,
                "to_step_order": 2,
                "outcome": "APPROVED",
                "condition_config": {
                    "field": "request_data.amount",
                    "operator": ">",
                    "value": 1000,
                },
            },
            # If Manager approves and amount <= 1000, finish
            {
                "from_step_order": 1,
                "to_step_order": None,
                "outcome": "APPROVED",
                "condition_config": {
                    "field": "request_data.amount",
                    "operator": "<=",
                    "value": 1000,
                },
            },
            # If VP approves, finish
            {"from_step_order": 2, "to_step_order": None, "outcome": "APPROVED"},
            # If anyone rejects, finish
            {"from_step_order": 1, "to_step_order": None, "outcome": "REJECTED"},
        ],
    }

    r = client.post(
        f"{settings.API_V1_PREFIX}/workflows/", json=workflow_data, headers=auth_emp
    )
    assert r.status_code == 200
    wf = r.json()
    wf_id = wf["id"]

    # 3. Start Workflow Request (Small Amount - Linear to End)
    request_data_small = {
        "workflow_id": wf_id,
        "request_data": {"amount": 500, "purpose": "Office supplies"},
    }
    r = client.post(
        f"{settings.API_V1_PREFIX}/requests/", json=request_data_small, headers=auth_emp
    )
    assert r.status_code == 200
    req_small = r.json()
    assert req_small["status"] == "IN_PROGRESS"

    # Approve small request
    process_data = {"outcome": "APPROVED", "context": {"note": "Looks good"}}
    r = client.post(
        f"{settings.API_V1_PREFIX}/requests/{req_small['id']}/process",
        json=process_data,
        headers=auth_mgr,
    )
    assert r.status_code == 200
    req_small_final = r.json()
    assert req_small_final["status"] == "COMPLETED"
    assert req_small_final["current_step_id"] is None

    # 4. Start Workflow Request (Large Amount - Branching)
    request_data_large = {
        "workflow_id": wf_id,
        "request_data": {"amount": 5000, "purpose": "New Laptop"},
    }
    r = client.post(
        f"{settings.API_V1_PREFIX}/requests/", json=request_data_large, headers=auth_emp
    )
    req_large = r.json()

    # Manager approves large request -> Should move to VP step
    r = client.post(
        f"{settings.API_V1_PREFIX}/requests/{req_large['id']}/process",
        json=process_data,
        headers=auth_mgr,
    )
    req_large_mid = r.json()
    assert req_large_mid["status"] == "IN_PROGRESS"
    assert req_large_mid["current_step_id"] is not None
    # Verify it moved to Step 2
    step2_id = next(s["id"] for s in wf["steps"] if s["name"] == "VP Approval")
    assert req_large_mid["current_step_id"] == step2_id

    # 5. Check Audit Logs for Small Request (Should be exactly 3: Started, Step 1 Completed, Workflow Completed)
    r = client.get(
        f"{settings.API_V1_PREFIX}/audit/?request_id={req_small['id']}",
        headers=auth_emp,
    )
    logs_small = r.json()
    assert len(logs_small) == 3

    # 6. Finish Large Workflow (VP Approval)
    r = client.post(
        f"{settings.API_V1_PREFIX}/requests/{req_large['id']}/process",
        json={"outcome": "APPROVED"},
        headers=auth_mgr,
    )
    assert r.status_code == 200
    req_large_final = r.json()
    assert req_large_final["status"] == "COMPLETED"

    # 7. Final Audit Check
    r = client.get(
        f"{settings.API_V1_PREFIX}/audit/?request_id={req_large['id']}",
        headers=auth_emp,
    )
    logs_large = r.json()
    assert len(logs_large) == 4  # Started, Step 1 Comp, Step 2 Comp, Workflow Comp
