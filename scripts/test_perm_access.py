from app.db.session import engine
from sqlalchemy import text

def test_permissions():
    try:
        with engine.connect() as conn:
            print("Trying to SELECT from permissions...")
            res = conn.execute(text("SELECT count(*) FROM permissions;"))
            print(f"Success! Count: {res.fetchone()[0]}")
    except Exception as e:
        print(f"Failed to access permissions table: {e}")

if __name__ == "__main__":
    test_permissions()
