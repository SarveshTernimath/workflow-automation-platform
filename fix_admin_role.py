import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models.user import User, Role

def fix_admin_roles():
    db = SessionLocal()
    try:
        print("Checking for users needing Admin role fix...")
        
        # Get Admin Role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            print("CRITICAL: 'admin' role not found in DB!")
            return

        # Find users with 'admin' in full name but missing the role
        users = db.query(User).filter(User.full_name.ilike("%admin%")).all()
        
        fixed_count = 0
        for user in users:
            has_role = any(r.id == admin_role.id for r in user.roles)
            if not has_role:
                print(f"Fixing user: {user.email} ({user.full_name}) - Adding Admin role")
                user.roles.append(admin_role)
                fixed_count += 1
            else:
                print(f"User {user.email} already has Admin role.")
        
        if fixed_count > 0:
            db.commit()
            print(f"Successfully fixed {fixed_count} users.")
        else:
            print("No users needed fixing.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_roles()
