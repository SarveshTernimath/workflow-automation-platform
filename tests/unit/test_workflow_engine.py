import pytest
from unittest.mock import MagicMock, patch
from uuid import uuid4
from datetime import datetime
from sqlalchemy.orm import configure_mappers
from app.db.base import Base
from app.services.workflow_engine import WorkflowEngine, ConditionEvaluator
from app.db.models.request import (
    RequestStatus,
    WorkflowRequest,
    RequestStep,
    StepStatus,
    RequestStateHistory,
)
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.db.models.audit import AuditLog
from app.core.exceptions import WorkflowEngineError, ConditionEvaluationError

# Force SQLAlchemy to initialize mappers
configure_mappers()


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def sample_workflow():
    wf_id = uuid4()
    wf = Workflow(id=wf_id, name="Test Workflow", is_active=True)

    step1 = WorkflowStep(
        id=uuid4(), workflow_id=wf_id, step_order=1, name="Step 1", sla_hours=24
    )
    step2 = WorkflowStep(
        id=uuid4(), workflow_id=wf_id, step_order=2, name="Step 2", sla_hours=24
    )

    wf.steps = [step1, step2]
    return wf, step1, step2


def test_start_workflow_success(mock_db, sample_workflow):
    wf, step1, step2 = sample_workflow
    wf_id = wf.id
    requester_id = uuid4()
    data = {"amount": 1000}

    def side_effect(model):
        m = MagicMock()
        if model == Workflow:
            m.filter.return_value.first.return_value = wf
        elif model == WorkflowStep:
            m.filter.return_value.first.return_value = step1
        return m

    mock_db.query.side_effect = side_effect

    with patch("app.tasks.notifications.notify_new_assignment.delay") as mock_notify:
        request = WorkflowEngine.start_workflow(mock_db, wf_id, requester_id, data)
        assert mock_notify.called

    assert request.workflow_id == wf_id
    assert request.requester_id == requester_id
    assert request.status == RequestStatus.IN_PROGRESS
    assert request.current_step_id == step1.id
    # Added lines: record state history, create request step, audit log
    assert mock_db.add.call_count >= 4


def test_process_step_linear(mock_db, sample_workflow):
    wf, step1, step2 = sample_workflow
    request_id = uuid4()
    actor_id = uuid4()

    request = WorkflowRequest(
        id=request_id,
        workflow_id=wf.id,
        current_step_id=step1.id,
        status=RequestStatus.IN_PROGRESS,
        request_data={"amount": 1000},
    )
    request.workflow = wf

    current_exec = RequestStep(
        request_id=request_id, step_id=step1.id, status=StepStatus.PENDING
    )
    current_exec.step = step1

    transition = StepTransition(
        from_step_id=step1.id, to_step_id=step2.id, outcome="APPROVED"
    )
    transition.to_step = step2

    def side_effect(model):
        m = MagicMock()
        if model == WorkflowRequest:
            m.filter.return_value.first.return_value = request
        elif model == RequestStep:
            m.filter.return_value.first.return_value = current_exec
        elif model == StepTransition:
            m.filter.return_value.all.return_value = [transition]
        elif model == WorkflowStep:
            # For _resolve_next if it returns the step from the transition
            pass
        return m

    mock_db.query.side_effect = side_effect

    mock_user = MagicMock(id=actor_id, roles=[])
    updated_request = WorkflowEngine.process_step(
        mock_db, request_id, mock_user, "APPROVED"
    )

    assert current_exec.status == "APPROVED"
    assert current_exec.assigned_to == actor_id
    assert updated_request.current_step_id == step2.id
    assert updated_request.status == RequestStatus.IN_PROGRESS


def test_process_step_terminal(mock_db, sample_workflow):
    wf, step1, step2 = sample_workflow
    request_id = uuid4()
    actor_id = uuid4()

    request = WorkflowRequest(
        id=request_id,
        workflow_id=wf.id,
        current_step_id=step2.id,
        status=RequestStatus.IN_PROGRESS,
    )
    current_exec = RequestStep(
        request_id=request_id, step_id=step2.id, status=StepStatus.PENDING
    )
    current_exec.step = step2

    def side_effect(model):
        m = MagicMock()
        if model == WorkflowRequest:
            m.filter.return_value.first.return_value = request
        elif model == RequestStep:
            m.filter.return_value.first.return_value = current_exec
        elif model == StepTransition:
            m.filter.return_value.all.return_value = []
        return m

    mock_db.query.side_effect = side_effect

    mock_user = MagicMock(id=actor_id, roles=[])
    updated_request = WorkflowEngine.process_step(
        mock_db, request_id, mock_user, "APPROVED"
    )

    assert updated_request.current_step_id is None
    assert updated_request.status == RequestStatus.COMPLETED


def test_condition_evaluator():
    evaluator = ConditionEvaluator()
    context = {"request_data": {"amount": 6000}, "decision_data": {"score": 80}}

    # Request data check
    config = {"field": "request_data.amount", "operator": ">", "value": 5000}
    assert evaluator.evaluate(config, context) is True

    # Nested field check
    config = {"field": "request_data.amount", "operator": "<", "value": 5000}
    assert evaluator.evaluate(config, context) is False

    # Decision data check
    config = {"field": "decision_data.score", "operator": ">=", "value": 70}
    assert evaluator.evaluate(config, context) is True


def test_condition_evaluator_invalid_path():
    evaluator = ConditionEvaluator()
    context = {"request_data": {"amount": 100}}

    # Non-existent field should return False (failed match)
    config = {"field": "request_data.missing", "operator": "==", "value": 100}
    assert evaluator.evaluate(config, context) is False
