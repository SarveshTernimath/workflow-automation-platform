import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from app.tasks.notifications import notify_new_assignment
from app.db.models.user import User, Role
from app.db.models.workflow import WorkflowStep


@pytest.fixture
def mock_db_session():
    with patch("app.tasks.notifications.SessionLocal") as mock:
        yield mock.return_value


def test_notify_new_assignment_finds_emails(mock_db_session):
    # Setup
    step_id = uuid4()
    role_id = uuid4()
    req_id = uuid4()

    mock_step = MagicMock(spec=WorkflowStep, id=step_id, required_role_id=role_id)
    mock_user = MagicMock(spec=User, email="test@example.com", is_active=True)

    # Mock query chain
    mock_db_session.query.return_value.filter.return_value.first.return_value = (
        mock_step
    )
    # For user query with join
    mock_db_session.query.return_value.join.return_value.filter.return_value.all.return_value = [
        mock_user
    ]

    with patch(
        "app.services.notification.NotificationService.notify_task_assigned"
    ) as mock_notify:
        count = notify_new_assignment(step_id, req_id, "WF", "Step", "today")

        assert count == 1
        mock_notify.assert_called_once()
        args, kwargs = mock_notify.call_args
        assert kwargs["email"] == "test@example.com"
