from typing import List, Dict
import logging
from app.db.models.request import RequestStatus
from app.core.exceptions import InvalidStateTransitionError

logger = logging.getLogger("workflow-platform.state_machine")

# Define valid state transitions
# Key: current state
# Value: list of allowed next states
STATE_TRANSITIONS: Dict[RequestStatus, List[RequestStatus]] = {
    RequestStatus.CREATED: [RequestStatus.IN_PROGRESS],
    RequestStatus.IN_PROGRESS: [
        RequestStatus.APPROVED,
        RequestStatus.REJECTED,
        RequestStatus.ESCALATED,
    ],
    RequestStatus.APPROVED: [RequestStatus.COMPLETED],
    RequestStatus.REJECTED: [RequestStatus.COMPLETED],
    RequestStatus.ESCALATED: [RequestStatus.IN_PROGRESS],
    RequestStatus.COMPLETED: [],  # Terminal state
}


def is_valid_transition(from_state: RequestStatus, to_state: RequestStatus) -> bool:
    """
    Check if a transition from from_state to to_state is allowed.
    """
    # Allow self-transition (staying in the same state)
    if from_state.value == to_state.value:
        return True

    allowed_states = STATE_TRANSITIONS.get(from_state, [])
    # Compare by value for robustness
    return any(to_state.value == s.value for s in allowed_states)


def validate_transition(from_state: RequestStatus, to_state: RequestStatus) -> None:
    """
    Validate a transition. Raises InvalidStateTransitionError if not allowed.
    """
    if not is_valid_transition(from_state, to_state):
        logger.warning(
            f"Invalid state transition attempt: {from_state.value} -> {to_state.value}",
            extra={"from_state": from_state.value, "to_state": to_state.value},
        )
        raise InvalidStateTransitionError(
            f"Invalid transition from '{from_state.value}' to '{to_state.value}'. "
            f"Allowed states: {[s.value for s in STATE_TRANSITIONS.get(from_state, [])]}"
        )

    if from_state != to_state:
        logger.info(
            f"State transition validated: {from_state.value} -> {to_state.value}",
            extra={"from_state": from_state.value, "to_state": to_state.value},
        )


def get_allowed_next_states(current_state: RequestStatus) -> List[RequestStatus]:
    """
    Get a list of allowed next states from the current state.
    """
    return STATE_TRANSITIONS.get(current_state, [])


def is_terminal_state(state: RequestStatus) -> bool:
    """
    Check if the given state is a terminal state (no transitions out).
    """
    return len(STATE_TRANSITIONS.get(state, [])) == 0
