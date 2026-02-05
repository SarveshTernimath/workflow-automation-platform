# Custom exception classes
# Responsibility: Define domain-specific exceptions
# Examples: InvalidStateTransitionError, PermissionDeniedError, SLABreachError


class InvalidStateTransitionError(Exception):
    """Raised when an invalid state transition is attempted"""

    pass


class PermissionDeniedError(Exception):
    """Raised when a user does not have required permissions"""

    pass


class ResourceNotFoundError(Exception):
    """Raised when a requested resource is not found"""

    pass


class WorkflowEngineError(Exception):
    """Raised when a core workflow engine operation fails"""

    pass


class ConditionEvaluationError(Exception):
    """Raised when a branching condition cannot be evaluated"""

    pass
