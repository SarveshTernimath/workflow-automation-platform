"""
Bootstrap Script
Responsibility: Initialize the database with required metadata (Roles) and the first Admin user.
Usage: python scripts/bootstrap.py
"""
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, engine
from app.db.base import Base  # Import from base.py to ensure all models are loaded
from app.db.models.user import User, Role
from app.core import security

def bootstrap():
    # Create tables if they don't exist
    print("Checking database schema...")
    Base.metadata.create_all(bind=engine)
    print("Schema check complete.")

    db = SessionLocal()
    from app.db.models.workflow import Workflow, WorkflowStep
    try:
        # 1. Ensure Roles exist
        roles = {
            "Admin": "System Administrator with full override mapping.",
            "Manager": "Strategic overseer for workflow authorization.",
            "User": "Operational node for task fulfillment."
        }
        
        role_objects = {}
        for role_name, description in roles.items():
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                print(f"Creating '{role_name}' role...")
                role = Role(name=role_name, description=description)
                db.add(role)
                db.flush()
            role_objects[role_name] = role

        # 2. Ensure initial Admin User exists
        admin_email = "admin@example.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            print(f"Creating initial admin user ({admin_email})...")
            admin_user = User(
                email=admin_email,
                username="admin",
                full_name="Default Admin",
                hashed_password=security.get_password_hash("admin123"),
                is_active=True
            )
            admin_user.roles.append(role_objects["Admin"])
            db.add(admin_user)
        else:
            print(f"Admin user ({admin_email}) exists. Updating password...")
            admin_user.hashed_password = security.get_password_hash("admin123")
            db.add(admin_user)

        # 3. Ensure a Manager User exists
        manager_email = "manager@example.com"
        manager_user = db.query(User).filter(User.email == manager_email).first()
        if not manager_user:
            print(f"Creating manager user ({manager_email})...")
            manager_user = User(
                email=manager_email,
                username="manager",
                full_name="Strategic Manager",
                hashed_password=security.get_password_hash("manager123"),
                is_active=True
            )
            manager_user.roles.append(role_objects["Manager"])
            db.add(manager_user)
        else:
            manager_user.hashed_password = security.get_password_hash("manager123")
            db.add(manager_user)

        # 4. Ensure a standard User exists
        user_email = "user@example.com"
        std_user = db.query(User).filter(User.email == user_email).first()
        if not std_user:
            print(f"Creating standard user ({user_email})...")
            std_user = User(
                email=user_email,
                username="user",
                full_name="Operational Node",
                hashed_password=security.get_password_hash("user123"),
                is_active=True
            )
            std_user.roles.append(role_objects["User"])
            db.add(std_user)
        else:
            std_user.hashed_password = security.get_password_hash("user123")
            db.add(std_user)

        # 5. Create a Demo Workflow
        demo_wf_name = "Operational Audit"
        demo_wf = db.query(Workflow).filter(Workflow.name == demo_wf_name).first()
        if not demo_wf:
            print(f"Creating '{demo_wf_name}' demo workflow...")
            demo_wf = Workflow(
                name=demo_wf_name,
                description="Standard cross-departmental auditing protocol with multi-stage verification.",
                created_by_id=admin_user.id
            )
            db.add(demo_wf)
            db.flush()

            # Add Steps
            s1 = WorkflowStep(workflow_id=demo_wf.id, name="Initial Scan", description="Automated scanning of operational logs.", step_type="AUTOMATED", order=1)
            s2 = WorkflowStep(workflow_id=demo_wf.id, name="Manual Verification", description="Human verification of signal anomalies.", step_type="MANUAL", order=2, assigned_role="Manager")
            s3 = WorkflowStep(workflow_id=demo_wf.id, name="Strategic Approval", description="Final executive sign-off on discovery findings.", step_type="MANUAL", order=3, assigned_role="Admin")
            
            db.add_all([s1, s2, s3])

        db.commit()
        print("Bootstrap complete successfully.")
    except Exception as e:
        print(f"Error during bootstrap: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap()
