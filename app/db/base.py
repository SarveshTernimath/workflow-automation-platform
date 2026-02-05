"""
Database base and model imports
Responsibility: Import all models for Alembic auto-generation
Must import all models here so Alembic can detect schema changes
"""

from app.db.session import Base

# Import all models so Alembic can detect them
from app.db.models.user import User, Role, Permission, user_roles, role_permissions
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.db.models.request import WorkflowRequest, RequestStep, RequestStateHistory
from app.db.models.audit import AuditLog, SLAEscalation

# This is required for Alembic to auto-generate migrations
# All models must be imported before running: alembic revision --autogenerate
