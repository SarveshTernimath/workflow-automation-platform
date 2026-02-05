import pytest
from typing import List, Optional
from app.services.rbac import (
    has_permission,
    has_role,
    get_user_permissions,
    check_permissions,
)
from app.core.exceptions import PermissionDeniedError


# Simple mock classes instead of SQLAlchemy models for pure unit testing
class MockPermission:
    def __init__(self, name: str):
        self.name = name


class MockRole:
    def __init__(self, name: str, permissions: List[MockPermission] = None):
        self.name = name
        self.permissions = permissions or []


class MockUser:
    def __init__(self, username: str, roles: List[MockRole] = None):
        self.username = username
        self.roles = roles or []


@pytest.fixture
def mock_permissions():
    """Create some mock permissions"""
    p1 = MockPermission(name="workflow:read")
    p2 = MockPermission(name="workflow:write")
    p3 = MockPermission(name="admin:all")
    return p1, p2, p3


@pytest.fixture
def mock_roles(mock_permissions):
    """Create mock roles with assigned permissions"""
    p1, p2, p3 = mock_permissions

    admin_role = MockRole(name="Admin", permissions=[p1, p2, p3])
    user_role = MockRole(name="User", permissions=[p1])

    return admin_role, user_role


@pytest.fixture
def mock_users(mock_roles):
    """Create mock users with assigned roles"""
    admin_role, user_role = mock_roles

    admin_user = MockUser(username="admin", roles=[admin_role])
    regular_user = MockUser(username="user", roles=[user_role])
    guest_user = MockUser(username="guest", roles=[])

    return admin_user, regular_user, guest_user


def test_has_role(mock_users):
    """Test role assignment checks"""
    admin_user, regular_user, guest_user = mock_users

    # We need to cast our MockUser to the expected type for the service (duck typing)
    assert has_role(admin_user, "Admin") is True
    assert has_role(admin_user, "User") is False
    assert has_role(regular_user, "User") is True
    assert has_role(guest_user, "User") is False


def test_has_permission(mock_users):
    """Test permission inheritance from roles"""
    admin_user, regular_user, guest_user = mock_users

    # Admin has all
    assert has_permission(admin_user, "workflow:read") is True
    assert has_permission(admin_user, "workflow:write") is True
    assert has_permission(admin_user, "admin:all") is True

    # User has limited
    assert has_permission(regular_user, "workflow:read") is True
    assert has_permission(regular_user, "workflow:write") is False
    assert has_permission(regular_user, "admin:all") is False

    # Guest has none
    assert has_permission(guest_user, "workflow:read") is False


def test_get_user_permissions(mock_users):
    """Test cumulative permission retrieval"""
    admin_user, regular_user, guest_user = mock_users

    admin_perms = get_user_permissions(admin_user)
    assert len(admin_perms) == 3
    assert "admin:all" in admin_perms

    regular_perms = get_user_permissions(regular_user)
    assert len(regular_perms) == 1
    assert "workflow:read" in regular_perms

    assert len(get_user_permissions(guest_user)) == 0


def test_check_permissions_raises(mock_users):
    """Test that check_permissions raises exception when needed"""
    admin_user, regular_user, guest_user = mock_users

    # Should not raise for admin
    check_permissions(admin_user, ["workflow:read", "admin:all"])

    # Should raise for user lacking admin:all
    with pytest.raises(PermissionDeniedError) as exc:
        check_permissions(regular_user, ["workflow:read", "admin:all"])
    assert "admin:all" in str(exc.value)

    # Should raise for guest lacking any
    with pytest.raises(PermissionDeniedError):
        check_permissions(guest_user, ["workflow:read"])


def test_multiple_roles(mock_roles):
    """Test user with multiple roles"""
    admin_role, user_role = mock_roles

    multi_role_user = MockUser(username="multi", roles=[admin_role, user_role])

    # Should have permissions from both roles (union)
    perms = get_user_permissions(multi_role_user)
    assert "admin:all" in perms
    assert "workflow:read" in perms
    assert len(perms) == 3
