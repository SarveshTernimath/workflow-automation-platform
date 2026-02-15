"""
Workflow Engine Service
Responsibility: Manage the lifecycle of workflow requests and step orchestration
"""

import logging
from typing import List, Optional, Any, Dict, Union
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.models.user import User, Role, Permission
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.db.models.request import (
    WorkflowRequest,
    RequestStep,
    RequestStatus,
    StepStatus,
    RequestStateHistory,
)
from app.db.models.audit import AuditLog
from app.services.state_machine import validate_transition
from app.services.audit_service import AuditService
from app.core.exceptions import (
    WorkflowEngineError,
    ConditionEvaluationError,
    PermissionDeniedError,
)
from app.tasks.notifications import notify_new_assignment

logger = logging.getLogger("workflow-platform.workflow_engine")


class ConditionEvaluator:
    """
    Decoupled dynamic condition evaluator.
    Designed for zero hardcoding - evaluates rules based on JSON configuration.
    """

    @staticmethod
    def evaluate(config: Optional[Dict[str, Any]], context: Dict[str, Any]) -> bool:
        """
        Evaluate a condition config against a provided data context.
        Supports nested fields and various operators.
        """
        if not config:
            return True

        try:
            field = config.get("field")
            operator = config.get("operator", "==")
            target_value = config.get("value")

            if not field:
                return True

            # Support nested field access e.g., "request_data.amount"
            actual_value = context
            for part in field.split("."):
                if isinstance(actual_value, dict):
                    actual_value = actual_value.get(part)
                else:
                    actual_value = None
                    break

            if actual_value is None and target_value is not None:
                return False

            return ConditionEvaluator._apply_operator(
                actual_value, operator, target_value
            )

        except Exception as e:
            logger.error(
                f"Logic evaluation error for field '{config.get('field')}': {e}"
            )
            return False

    @staticmethod
    def _apply_operator(actual: Any, operator: str, target: Any) -> bool:
        try:
            if operator == "==":
                return actual == target
            if operator == "!=":
                return actual != target

            # Numeric comparisons
            if operator in [">", "<", ">=", "<="]:
                f_actual = float(actual)
                f_target = float(target)
                if operator == ">":
                    return f_actual > f_target
                if operator == "<":
                    return f_actual < f_target
                if operator == ">=":
                    return f_actual >= f_target
                if operator == "<=":
                    return f_actual <= f_target

            if operator == "in":
                return actual in target
            if operator == "contains":
                return target in actual

            return False
        except (ValueError, TypeError):
            return False


class WorkflowEngine:
    """
    Enterprise-grade engine for workflow orchestration.

    Key Principles:
    - Zero Hardcoding: All flow is defined in DB.
    - Observability: Every transition is logged and audited.
    - Safety: State transitions are validated before persistence.
    """

    @staticmethod
    def start_workflow(
        db: Session, workflow_id: UUID, requester_id: UUID, data: Dict[str, Any]
    ) -> WorkflowRequest:
        """
        Initiate a workflow instance.
        """
        workflow = (
            db.query(Workflow)
            .filter(Workflow.id == workflow_id, Workflow.is_active == True)
            .first()
        )
        if not workflow:
            raise WorkflowEngineError(
                f"Workflow definition {workflow_id} not found or inactive"
            )

        # Create the request instance
        request = WorkflowRequest(
            workflow_id=workflow_id,
            requester_id=requester_id,
            request_data=data,
            status=RequestStatus.CREATED,
        )
        db.add(request)
        db.flush()

        # Update status via state machine
        initial_status = request.status
        validate_transition(initial_status, RequestStatus.IN_PROGRESS)
        request.status = RequestStatus.IN_PROGRESS

        # Record state history
        history = RequestStateHistory(
            request_id=request.id,
            from_status=initial_status,
            to_status=RequestStatus.IN_PROGRESS,
            changed_by=requester_id,
            reason="Workflow initiation",
        )
        db.add(history)

        # Initialize first step
        first_step = (
            db.query(WorkflowStep)
            .filter(
                WorkflowStep.workflow_id == workflow_id, WorkflowStep.step_order == 1
            )
            .first()
        )

        if not first_step:
            raise WorkflowEngineError(
                "Workflow started but no first step (order=1) is defined"
            )

        now = datetime.utcnow()
        deadline = now + timedelta(hours=first_step.sla_hours)

        engine_step = RequestStep(
            request_id=request.id,
            step_id=first_step.id,
            status=StepStatus.PENDING,
            started_at=now,
            deadline=deadline,
        )
        db.add(engine_step)
        request.current_step_id = first_step.id

        # System Audit
        AuditService.log_action(
            db,
            action="WORKFLOW_STARTED",
            resource_type="workflow_request",
            resource_id=str(request.id),
            actor_id=requester_id,
            request_id=request.id,
            meta_data={"workflow_id": str(workflow_id)},
        )

        # Trigger notification
        notify_new_assignment.delay(
            step_id=first_step.id,
            request_id=request.id,
            workflow_name=workflow.name,
            step_name=first_step.name,
            deadline=deadline.isoformat(),
        )

        logger.info(f"Started WorkflowRequest {request.id} for Workflow {workflow_id}")
        return request

    @staticmethod
    def process_step(
        db: Session,
        request_id: UUID,
        user: User,
        outcome: str,
        context: Dict[str, Any] = None,
    ) -> WorkflowRequest:
        """
        Process a step completion and transition to the next state.
        Includes mandatory RBAC check for the current step.
        """
        request = (
            db.query(WorkflowRequest).filter(WorkflowRequest.id == request_id).first()
        )
        if not request:
            raise WorkflowEngineError(f"Request {request_id} not found")

        current_exec = (
            db.query(RequestStep)
            .filter(
                RequestStep.request_id == request_id,
                RequestStep.step_id == request.current_step_id,
                RequestStep.completed_at == None,
            )
            .first()
        )

        if not current_exec:
            raise WorkflowEngineError(
                "Logical Conflict: Request is active but has no pending execution step"
            )

        # --- RBAC Enforcement ---
        # Admin Bypass: Allow admins to execute any step
        is_admin = any(r.name.lower() == "admin" for r in user.roles)
        
        if not is_admin:
            step_def = current_exec.step
            user_role_ids = [role.id for role in user.roles]
            if step_def.required_role_id:
                if step_def.required_role_id not in user_role_ids:
                    logger.warning(
                        f"User {user.id} lacks required role {step_def.required_role_id} for step {step_def.id}"
                    )
                    raise PermissionDeniedError(
                        f"User lacks required role for this workflow step"
                    )

            if step_def.required_permission_id:
                user_permission_ids = set()
                for role in user.roles:
                    for perm in role.permissions:
                        user_permission_ids.add(perm.id)
                if step_def.required_permission_id not in user_permission_ids:
                    logger.warning(
                        f"User {user.id} lacks required permission {step_def.required_permission_id} for step {step_def.id}"
                    )
                    raise PermissionDeniedError(
                        f"User lacks required permission for this workflow step"
                    )
        # ------------------------


        # 1. Close current step
        current_exec.assigned_to = user.id
        current_exec.status = outcome  # Typically maps to APPROVED, REJECTED
        current_exec.decision_data = context
        # Save comment explicitly to the column if provided
        if context and "comment" in context:
            current_exec.comments = context["comment"]
            
        current_exec.completed_at = datetime.utcnow()

        # 2. Resolve Next Path
        # Combine initial request data with step decision data for branching
        eval_context = {
            "request_data": request.request_data or {},
            "decision_data": context or {},
        }

        next_step = WorkflowEngine._resolve_next(
            db, request.current_step_id, outcome, eval_context
        )

        if next_step:
            now = datetime.utcnow()
            deadline = now + timedelta(hours=next_step.sla_hours)

            # Transition to next step
            new_exec = RequestStep(
                request_id=request.id,
                step_id=next_step.id,
                status=StepStatus.PENDING,
                started_at=now,
                deadline=deadline,
            )
            db.add(new_exec)
            request.current_step_id = next_step.id

            # Trigger notification (Safe Mode)
            try:
                notify_new_assignment.delay(
                    step_id=next_step.id,
                    request_id=request.id,
                    workflow_name=request.workflow.name,
                    step_name=next_step.name,
                    deadline=deadline.isoformat(),
                )
            except Exception as e:
                logger.error(f"Failed to send notification for Request {request.id}: {e}")

            logger.info(f"Request {request_id} moved to step: {next_step.name}")
        else:
            # End of flow orchestration
            WorkflowEngine._finalize(db, request, outcome, user.id)
            logger.info(f"Workflow {request_id} finalized with outcome: {outcome}")

        AuditService.log_action(
            db,
            action="STEP_COMPLETED",
            resource_type="request_step",
            resource_id=str(current_exec.id),
            actor_id=user.id,
            request_id=request.id,
            meta_data={"outcome": outcome, "step_id": str(current_exec.step_id)},
        )

        return request

    @staticmethod
    def _resolve_next(
        db: Session, from_step_id: UUID, outcome: str, context: Dict[str, Any]
    ) -> Optional[WorkflowStep]:
        """
        Find the next step based on defined transitions and conditions.
        """
        transitions = (
            db.query(StepTransition)
            .filter(
                StepTransition.from_step_id == from_step_id,
                StepTransition.outcome == outcome,
            )
            .all()
        )

        if not transitions:
            return None

        # Filter by conditions
        for trans in transitions:
            if not trans.condition_config:
                return trans.to_step

            if ConditionEvaluator.evaluate(trans.condition_config, context):
                return trans.to_step

        return None

    @staticmethod
    def _finalize(db: Session, request: WorkflowRequest, outcome: str, actor_id: UUID):
        """
        Move request to terminal state.
        """
        old_status = request.status
        target_status = (
            RequestStatus.APPROVED if outcome == "APPROVED" else RequestStatus.REJECTED
        )

        # Intermediate terminal check
        validate_transition(old_status, target_status)
        request.status = target_status

        # Log intermediate state
        db.add(
            RequestStateHistory(
                request_id=request.id,
                from_status=old_status,
                to_status=target_status,
                changed_by=actor_id,
                reason=f"Final step outcome: {outcome}",
            )
        )

        # Final terminal state
        validate_transition(request.status, RequestStatus.COMPLETED)
        final_status = RequestStatus.COMPLETED
        request.status = final_status
        request.current_step_id = None
        request.completed_at = datetime.utcnow()

        db.add(
            RequestStateHistory(
                request_id=request.id,
                from_status=target_status,
                to_status=final_status,
                changed_by=actor_id,
                reason="Workflow completion",
            )
        )

        AuditService.log_action(
            db,
            action="WORKFLOW_COMPLETED",
            resource_type="workflow_request",
            resource_id=str(request.id),
            actor_id=actor_id,
            request_id=request.id,
            meta_data={"final_outcome": outcome},
        )
