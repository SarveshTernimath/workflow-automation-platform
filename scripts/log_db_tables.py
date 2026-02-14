from app.db.session import engine
from sqlalchemy import text

def log_tables():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;"))
            tables = [row[0] for row in result.fetchall()]
            with open('db_tables_log.txt', 'w') as f:
                f.write(f"Discovered {len(tables)} tables:\n")
                for table in tables:
                    f.write(f"- {table}\n")
            print(f"Logged {len(tables)} tables to db_tables_log.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    log_tables()
