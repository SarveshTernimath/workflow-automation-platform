"""
RBAC Service
Responsibility: Define logic for checking user roles and permissions
"""

import logging
from typing import List, Set
from app.db.models.user import User
from app.core.exceptions import PermissionDeniedError

logger = logging.getLogger("workflow-platform.rbac")


def has_permission(user: User, permission_name: str) -> bool:
    """
    Check if a user has a specific permission through any of their roles.
    """
    # If no roles, no permissions
    if not user.roles:
        return False

    for role in user.roles:
        for permission in role.permissions:
            if permission.name == permission_name:
                return True
    return False


def has_role(user: User, role_name: str) -> bool:
    """
    Check if a user has a specific role assigned.
    """
    if not user.roles:
        return False

    return any(role.name == role_name for role in user.roles)


def get_user_permissions(user: User) -> Set[str]:
    """
    Get all unique permission names for a user.
    """
    permissions = set()
    if not user.roles:
        return permissions

    for role in user.roles:
        for permission in role.permissions:
            permissions.add(permission.name)
    return permissions


def check_permissions(user: User, required_permissions: List[str]) -> None:
    """
    Check if a user has all of the required permissions.
    Raises PermissionDeniedError if any are missing.
    """
    user_perms = get_user_permissions(user)
    missing = [p for p in required_permissions if p not in user_perms]

    if missing:
        logger.warning(
            f"User '{user.username}' denied access. Missing permissions: {', '.join(missing)}",
            extra={"username": user.username, "missing_permissions": missing},
        )
        raise PermissionDeniedError(
            f"User lacks required permissions: {', '.join(missing)}"
        )

    logger.debug(
        f"User '{user.username}' authorized with permissions: {', '.join(required_permissions)}",
        extra={"username": user.username, "permissions": required_permissions},
    )


def check_role(user: User, required_role: str) -> None:
    """
    Check if a user has the required role.
    Raises PermissionDeniedError if not.
    """
    if not has_role(user, required_role):
        raise PermissionDeniedError(f"User lacks required role: {required_role}")
