import sys
import os
from sqlalchemy.orm import Session
from uuid import uuid4

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models.user import User, Role, Permission
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.core import security

def seed_db():
    db = SessionLocal()
    try:
        print("Starting database seeding...")

        # 1. Create Permissions
        permissions_data = [
            {"name": "workflow:create", "resource": "workflow", "action": "create", "description": "Create new workflows"},
            {"name": "workflow:read", "resource": "workflow", "action": "read", "description": "View workflows"},
            {"name": "workflow:update", "resource": "workflow", "action": "update", "description": "Edit workflows"},
            {"name": "workflow:delete", "resource": "workflow", "action": "delete", "description": "Delete workflows"},
            {"name": "request:create", "resource": "request", "action": "create", "description": "Initiate workflow requests"},
            {"name": "request:read", "resource": "request", "action": "read", "description": "View requests"},
            {"name": "request:approve", "resource": "request", "action": "approve", "description": "Approve request steps"},
            {"name": "request:reject", "resource": "request", "action": "reject", "description": "Reject request steps"},
            {"name": "user:manage", "resource": "user", "action": "manage", "description": "Manage system users"},
        ]

        perms = {}
        for p_data in permissions_data:
            perm = db.query(Permission).filter(Permission.name == p_data["name"]).first()
            if not perm:
                perm = Permission(**p_data)
                db.add(perm)
                db.flush()
            perms[p_data["name"]] = perm

        print(f"Seeded {len(perms)} permissions.")

        # 2. Create Roles
        roles_data = [
            {
                "name": "admin", 
                "description": "Full system access", 
                "perms": list(perms.values())
            },
            {
                "name": "strategic_node", 
                "description": "Management and oversight", 
                "perms": [perms["workflow:read"], perms["request:read"], perms["request:approve"], perms["request:reject"]]
            },
            {
                "name": "operational_node", 
                "description": "Standard user access", 
                "perms": [perms["workflow:read"], perms["request:create"], perms["request:read"]]
            },
        ]

        roles = {}
        for r_data in roles_data:
            role = db.query(Role).filter(Role.name == r_data["name"]).first()
            if not role:
                role = Role(name=r_data["name"], description=r_data["description"])
                role.permissions = r_data["perms"]
                db.add(role)
                db.flush()
            roles[r_data["name"]] = role

        print(f"Seeded {len(roles)} roles.")

        # 3. Create Admin User
        print("Checking for admin user...")
        admin_email = "admin@nexusflow.ai"
        admin_user = db.query(User).filter(
            (User.email == admin_email) | (User.username == "admin")
        ).first()
        if not admin_user:
            print("Creating admin user...")
            admin_user = User(
                email=admin_email,
                username="admin",
                full_name="System Administrator",
                hashed_password=security.get_password_hash("admin123"),
                is_active=True
            )
            print("Assigning admin role...")
            admin_user.roles = [roles["admin"]]
            db.add(admin_user)
            print("Flushing admin user...")
            db.flush()
            print(f"Created admin user: {admin_email}")
        else:
            print("Admin user already exists.")

        # 4. Create Sample Workflow: Supply Chain Authorization
        wf_name = "Supply Chain Authorization"
        workflow = db.query(Workflow).filter(Workflow.name == wf_name).first()
        if not workflow:
            workflow = Workflow(
                name=wf_name,
                description="Standardized protocol for cross-regional supply chain deployments and resource allocation.",
                created_by=admin_user.id
            )
            db.add(workflow)
            db.flush()

            # Steps
            step1 = WorkflowStep(
                workflow_id=workflow.id,
                step_order=1,
                name="Initial Submission",
                description="Node initiates the resource allocation request with preliminary data.",
                required_role_id=roles["operational_node"].id,
                sla_hours=24
            )
            step2 = WorkflowStep(
                workflow_id=workflow.id,
                step_order=2,
                name="Strategic Review",
                description="Management evaluates the proposal against quarterly strategic targets.",
                required_role_id=roles["strategic_node"].id,
                sla_hours=48
            )
            step3 = WorkflowStep(
                workflow_id=workflow.id,
                step_order=3,
                name="Executive Approval",
                description="Final authorization for resource deployment by regional command.",
                required_role_id=roles["admin"].id,
                sla_hours=72
            )
            db.add_all([step1, step2, step3])
            db.flush()

            # Transitions
            # Step 1 Approved -> Step 2
            t1 = StepTransition(from_step_id=step1.id, to_step_id=step2.id, outcome="APPROVED")
            # Step 1 Rejected -> End (Terminal)
            t2 = StepTransition(from_step_id=step1.id, to_step_id=None, outcome="REJECTED")
            
            # Step 2 Approved -> Step 3
            t3 = StepTransition(from_step_id=step2.id, to_step_id=step3.id, outcome="APPROVED")
            # Step 2 Rejected -> End
            t4 = StepTransition(from_step_id=step2.id, to_step_id=None, outcome="REJECTED")

            # Step 3 Approved -> End (COMPLETED)
            t5 = StepTransition(from_step_id=step3.id, to_step_id=None, outcome="APPROVED")
            # Step 3 Rejected -> End
            t6 = StepTransition(from_step_id=step3.id, to_step_id=None, outcome="REJECTED")

            db.add_all([t1, t2, t3, t4, t5, t6])
            
            print(f"Seeded sample workflow: {wf_name}")

        db.commit()
        print("Database seeding complete!")
    except Exception as e:
        import traceback
        db.rollback()
        print("Error seeding database:")
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
