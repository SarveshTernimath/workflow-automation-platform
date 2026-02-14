from app.db.session import engine
from sqlalchemy import text

def check_tables():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;"))
            tables = [row[0] for row in result.fetchall()]
            print(f"Discovered {len(tables)} tables in 'public' schema:")
            for table in tables:
                print(f"- {table}")
    except Exception as e:
        print(f"Error checking tables: {e}")

if __name__ == "__main__":
    check_tables()
