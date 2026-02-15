
import sys
import os
from uuid import uuid4
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models.user import User
from app.services.workflow_engine import WorkflowEngine
from app.api.v1.endpoints.workflow_instances import make_decision
from app.core.exceptions import WorkflowEngineError

def reproduce_500():
    db = SessionLocal()
    try:
        print("Starting reproduction...")
        # Get admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("No admin user found.")
            return

        # Find a pending step
        from app.db.models.request import RequestStep, StepStatus
        step = db.query(RequestStep).filter(RequestStep.status == StepStatus.PENDING).first()
        
        if not step:
            print("No pending step found. Please create a workflow instance first.")
            return
            
        print(f"Testing execution on Request {step.request_id}, Step {step.step_id}")
        
        try:
            # Simulate the endpoint call logic directly
            payload = {"action": "approve", "comment": "Test execution"}
            print(f"Payload: {payload}")
            
            # Calling engine directly to see trace
            request = WorkflowEngine.process_step(
                db, 
                step.request_id, 
                admin, 
                "APPROVED", 
                {"comment": "Test execution", "action": "approve"}
            )
            print("Success! Request status:", request.status)
            
        except Exception as e:
            print("\n!!! CAUGHT EXCEPTION !!!")
            import traceback
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    reproduce_500()
