"""
User, Role, and Permission models
Responsibility: Define SQLAlchemy models for RBAC
Tables: users, roles, permissions, user_roles, role_permissions
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Table, Text, Uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base


# Association table for many-to-many relationship between users and roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("id", Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "user_id",
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "role_id",
        Uuid(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "assigned_at",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    ),
    Column(
        "assigned_by",
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    ),
)


# Association table for many-to-many relationship between roles and permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("id", Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column(
        "role_id",
        Uuid(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "permission_id",
        Uuid(as_uuid=True),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "created_at", DateTime(timezone=True), server_default=func.now(), nullable=False
    ),
)


class User(Base):
    """
    User model - represents system users
    """

    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    # Use primaryjoin/secondaryjoin to resolve ambiguity caused by 'assigned_by' column in user_roles
    roles = relationship(
        "Role",
        secondary=user_roles,
        back_populates="users",
        primaryjoin="User.id == user_roles.c.user_id",
        secondaryjoin="Role.id == user_roles.c.role_id",
    )
    workflow_requests = relationship(
        "WorkflowRequest",
        back_populates="requester",
        foreign_keys="[WorkflowRequest.requester_id]",
    )
    audit_logs = relationship(
        "AuditLog", back_populates="actor", foreign_keys="[AuditLog.actor_id]"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"


class Role(Base):
    """
    Role model - represents user roles (e.g., Admin, Manager, Employee)
    """

    __tablename__ = "roles"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    users = relationship(
        "User",
        secondary=user_roles,
        back_populates="roles",
        primaryjoin="Role.id == user_roles.c.role_id",
        secondaryjoin="User.id == user_roles.c.user_id",
    )
    # Specified primary/secondary join to be explicit and avoid any potential ambiguity
    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles",
        primaryjoin="Role.id == role_permissions.c.role_id",
        secondaryjoin="Permission.id == role_permissions.c.permission_id",
    )
    workflow_steps = relationship(
        "WorkflowStep",
        back_populates="required_role",
        foreign_keys="[WorkflowStep.required_role_id]",
    )

    def __repr__(self):
        return f"<Role(id={self.id}, name={self.name})>"


class Permission(Base):
    """
    Permission model - represents granular permissions
    """

    __tablename__ = "permissions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    resource = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    roles = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="permissions",
        primaryjoin="Permission.id == role_permissions.c.permission_id",
        secondaryjoin="Role.id == role_permissions.c.role_id",
    )
    workflow_steps = relationship(
        "WorkflowStep",
        back_populates="required_permission",
        foreign_keys="[WorkflowStep.required_permission_id]",
    )

    def __repr__(self):
        return f"<Permission(id={self.id}, name={self.name}, resource={self.resource}, action={self.action})>"
