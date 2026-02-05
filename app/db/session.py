"""
Database session management
Responsibility: Create database engine, session factory, and base declarative class
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create database engine
# pool_pre_ping=True ensures connections are valid before using them
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# Create session factory
# autocommit=False: Transactions must be explicitly committed
# autoflush=False: Don't automatically flush changes to DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session.
    Used with FastAPI's dependency injection.

    Yields:
        Session: Database session

    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
