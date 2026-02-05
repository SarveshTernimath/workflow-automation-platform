from typing import Generator
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
import sys
import os

# Add app to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import Base
from app.main import app
from app.api import deps
from app.core.celery_app import celery_app
from app.core.config import settings

# Prevent Celery from trying to connect to Redis during tests
celery_app.conf.update(task_always_eager=True)

# Disable SMTP for tests
settings.SMTP_USER = None
settings.SMTP_PASSWORD = None

# Use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def db_engine():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield engine
    # Drop tables
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    # Remove file
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def override_get_db(db: Session):
    def _override_get_db():
        yield db

    app.dependency_overrides[deps.get_db] = _override_get_db
    yield
    app.dependency_overrides.pop(deps.get_db)
