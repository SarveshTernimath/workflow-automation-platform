import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import configure_mappers
from app.services.sla_monitor import SLAMonitor
from app.db.models.request import RequestStep, StepStatus

# Force SQLAlchemy to initialize mappers
configure_mappers()


@pytest.fixture
def mock_db():
    return MagicMock()


def test_scan_for_breaches_detected(mock_db):
    # Setup overdue step
    step_id = uuid4()
    req_id = uuid4()
    mock_workflow = MagicMock(name="Workflow")
    mock_workflow.name = "Test Workflow"
    mock_step_def = MagicMock(name="StepDef")
    mock_step_def.name = "Test Step"
    mock_request = MagicMock(name="Request")
    mock_request.workflow = mock_workflow

    overdue_step = RequestStep(
        id=step_id,
        request_id=req_id,
        status=StepStatus.PENDING,
        deadline=datetime.utcnow() - timedelta(hours=1),
        is_sla_breached=False,
    )
    overdue_step.request = mock_request
    overdue_step.step = mock_step_def

    mock_db.query.return_value.filter.return_value.all.return_value = [overdue_step]

    with patch("app.services.audit_service.AuditService.log_action") as mock_audit, \
         patch("app.services.sla_monitor.send_sla_breach_email") as mock_email:
        count = SLAMonitor.scan_for_breaches(mock_db)

        assert count == 1
        assert overdue_step.is_sla_breached is True
        assert mock_db.add.call_count >= 1  # Escalation record
        assert mock_db.commit.called
        assert mock_audit.called


def test_scan_for_breaches_none(mock_db):
    # Setup healthy step
    mock_db.query.return_value.filter.return_value.all.return_value = []

    count = SLAMonitor.scan_for_breaches(mock_db)
    assert count == 0
    assert not mock_db.commit.called
