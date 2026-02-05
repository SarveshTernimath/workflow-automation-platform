import pytest
from app.db.models.request import RequestStatus
from app.services.state_machine import (
    is_valid_transition,
    validate_transition,
    is_terminal_state,
    get_allowed_next_states,
)
from app.core.exceptions import InvalidStateTransitionError


def test_valid_transitions():
    """Test transitions that should be allowed"""
    assert is_valid_transition(RequestStatus.CREATED, RequestStatus.IN_PROGRESS) is True
    assert (
        is_valid_transition(RequestStatus.IN_PROGRESS, RequestStatus.APPROVED) is True
    )
    assert (
        is_valid_transition(RequestStatus.IN_PROGRESS, RequestStatus.REJECTED) is True
    )
    assert (
        is_valid_transition(RequestStatus.IN_PROGRESS, RequestStatus.ESCALATED) is True
    )
    assert is_valid_transition(RequestStatus.APPROVED, RequestStatus.COMPLETED) is True
    assert is_valid_transition(RequestStatus.REJECTED, RequestStatus.COMPLETED) is True
    assert (
        is_valid_transition(RequestStatus.ESCALATED, RequestStatus.IN_PROGRESS) is True
    )


def test_self_transitions():
    """Test that staying in the same state is allowed"""
    for status in RequestStatus:
        assert is_valid_transition(status, status) is True


def test_invalid_transitions():
    """Test transitions that should be forbidden"""
    # Cannot skip IN_PROGRESS
    assert is_valid_transition(RequestStatus.CREATED, RequestStatus.APPROVED) is False
    assert is_valid_transition(RequestStatus.CREATED, RequestStatus.COMPLETED) is False

    # Cannot go backwards from COMPLETED
    assert is_valid_transition(RequestStatus.COMPLETED, RequestStatus.CREATED) is False
    assert (
        is_valid_transition(RequestStatus.COMPLETED, RequestStatus.IN_PROGRESS) is False
    )

    # Cannot go from APPROVED to IN_PROGRESS
    assert (
        is_valid_transition(RequestStatus.APPROVED, RequestStatus.IN_PROGRESS) is False
    )


def test_validate_transition_exception():
    """Test that validate_transition raises an exception for invalid transitions"""
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(RequestStatus.CREATED, RequestStatus.COMPLETED)

    # Should not raise for valid transition
    validate_transition(RequestStatus.CREATED, RequestStatus.IN_PROGRESS)


def test_terminal_states():
    """Test detection of terminal states"""
    assert is_terminal_state(RequestStatus.COMPLETED) is True
    assert is_terminal_state(RequestStatus.CREATED) is False
    assert is_terminal_state(RequestStatus.IN_PROGRESS) is False


def test_get_allowed_next_states():
    """Test retrieval of allowed next states"""
    allowed = get_allowed_next_states(RequestStatus.IN_PROGRESS)
    assert RequestStatus.APPROVED in allowed
    assert RequestStatus.REJECTED in allowed
    assert RequestStatus.ESCALATED in allowed
    assert len(allowed) == 3

    assert len(get_allowed_next_states(RequestStatus.COMPLETED)) == 0
