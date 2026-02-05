"""
Workflow Service
Responsibility: Manage workflow definitions (Workflows, Steps, Transitions)
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.db.models.workflow import Workflow, WorkflowStep, StepTransition
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
)  # I'll need to ensure these exist
from app.core.exceptions import ResourceNotFoundError

logger = logging.getLogger("workflow-platform.workflow_service")


class WorkflowService:
    @staticmethod
    def create_workflow(
        db: Session, workflow_in: Dict[str, Any], creator_id: UUID
    ) -> Workflow:
        """
        Create a new workflow with nested steps and transitions.
        """
        workflow = Workflow(
            name=workflow_in["name"],
            description=workflow_in.get("description"),
            created_by=creator_id,
            is_active=True,
        )
        db.add(workflow)
        db.flush()

        steps_map = {}  # To link transitions to step IDs later

        # Create steps
        for step_data in workflow_in.get("steps", []):
            step = WorkflowStep(
                workflow_id=workflow.id,
                name=step_data["name"],
                description=step_data.get("description"),
                step_order=step_data["step_order"],
                sla_hours=step_data.get("sla_hours", 24),
                required_role_id=step_data.get("required_role_id"),
                required_permission_id=step_data.get("required_permission_id"),
                is_conditional=step_data.get("is_conditional", False),
                condition_config=step_data.get("condition_config"),
            )
            db.add(step)
            db.flush()
            steps_map[step.step_order] = step

        # Create transitions
        for trans_data in workflow_in.get("transitions", []):
            from_step = steps_map.get(trans_data["from_step_order"])
            # explicitly resolve to_step, or None if order is null/missing
            to_step_order = trans_data.get("to_step_order")
            to_step = (
                steps_map.get(to_step_order) if to_step_order is not None else None
            )

            if not from_step:
                continue

            transition = StepTransition(
                from_step_id=from_step.id,
                to_step_id=to_step.id if to_step else None,
                outcome=trans_data["outcome"],
                condition_config=trans_data.get("condition_config"),
            )
            db.add(transition)

        db.commit()
        db.refresh(workflow)
        return workflow

    @staticmethod
    def get_workflow(db: Session, workflow_id: UUID) -> Workflow:
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise ResourceNotFoundError(f"Workflow {workflow_id} not found")
        return workflow

    @staticmethod
    def list_workflows(db: Session, skip: int = 0, limit: int = 100) -> List[Workflow]:
        return db.query(Workflow).offset(skip).limit(limit).all()

    @staticmethod
    def delete_workflow(db: Session, workflow_id: UUID) -> None:
        workflow = WorkflowService.get_workflow(db, workflow_id)
        db.delete(workflow)
        db.commit()
