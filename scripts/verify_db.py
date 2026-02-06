from app.db.session import SessionLocal
from app.db.models.user import User, Role, Permission
from app.db.models.workflow import Workflow, WorkflowStep
from sqlalchemy import text

def verify_db():
    db = SessionLocal()
    try:
        print("Checking Database Connection... OK")
        
        # Check Tables for PostgreSQL
        tables = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")).fetchall()
        table_names = [t[0] for t in tables]
        required_tables = ['users', 'roles', 'permissions', 'workflows', 'workflow_steps']
        
        print(f"\nExisting Tables: {len(table_names)}")
        for req in required_tables:
            if req in table_names:
                print(f"✅ Table '{req}' exists")
            else:
                print(f"❌ Table '{req}' MISSING")

        # Check Data
        user_count = db.query(User).count()
        role_count = db.query(Role).count()
        wf_count = db.query(Workflow).count()
        
        print(f"\nData Integrity:")
        print(f"Users: {user_count}")
        print(f"Roles: {role_count}")
        print(f"Workflows: {wf_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_db()
