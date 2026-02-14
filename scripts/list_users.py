from app.db.session import engine
from sqlalchemy import text

def list_users():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT email, username FROM users;"))
            users = result.fetchall()
            print(f"Discovered {len(users)} users:")
            for user in users:
                print(f"- Email: {user[0]}, Username: {user[1]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_users()
