# 🏗️ NexusFlow: Technical Architecture & System Design

NexusFlow is engineered as an industrial-grade, generic workflow automation engine. It moves beyond standard CRUD applications by implementing a dynamic, data-driven orchestration logic.

---

## 1. Dynamic Workflow Engine (Zero-Hardcoding)
The core philosophy is **Orchestration via Configuration**.
- **Logic Matrix**: Workflows are not defined in code but as a series of `Steps` and `Transitions` in the database.
- **Dynamic Resolution**: When a step is completed, the `WorkflowEngine` queries the transition table with the `outcome` and `context` (data) to find the next node.
- **Extensibility**: Adding a new business process only requires inserting rows into the database—no code deployment needed.

## 2. Rigid State Machine Architecture
To prevent data corruption and unauthorized flow:
- **Enum Enforcement**: All requests follow a strict `CREATED -> IN_PROGRESS -> COMPLETED/REJECTED` lifecycle.
- **Atomic Transitions**: State changes are wrapped in SQLAlchemy transactions. Any partial failure triggers an immediate rollback.
- **Validation Middleware**: A dedicated `StateMachine` service validates if a transition (e.g., `REJECTED -> COMPLETED`) is logically permissible before allowing the update.

## 3. Persistent RBAC (Role-Based Access Control)
Authorization is enforced at the deepest level:
- **Permission Matrix**: Actions are gated by specific Permissions mapped to Roles.
- **Engine-Level Checks**: The `WorkflowEngine` performs a mandatory RBAC check *before* processing any step, ensuring the `current_user` has the required clearance level for that specific node.

## 4. SLA Monitoring & Escalation Engine
Time is a first-class citizen in NexusFlow:
- **Context-Aware Deadlines**: Each step is assigned an `SLA_HOURS`. The deadline is calculated dynamically upon step activation.
- **Background Pulse**: A Celery background worker (`scan_for_breaches`) runs periodically to identity overdue tasks.
- **Automated Escalation**: When a breach is detected, the system:
    1.  Switches flags to `is_sla_breached`.
    2.  Creates an immutable escalation record.
    3.  Triggers a high-priority notification to the supervisor role.

## 5. Immutable Audit & Compliance
Every pulse of the system is captured:
- **Historical Traceability**: Audit logs store the `actor`, `timestamp`, `action`, and `metadata` (JSON).
- **No-Edit Policy**: The database schema and API are designed so that audit logs cannot be modified or deleted by users or managers.
- **Decision Context**: Notes and justifications for every approval/rejection are captured alongside the state change.

---

## 🛠️ Performance & Scalability
- **Asynchronous Processing**: FastAPI's async loops handle frontend requests, while Celery offloads heavy logic (Email, SLA scanning) to a task queue.
- **SQLAlchemy 2.0**: Utilizing modern ORM patterns for type-safe database interactions.
- **Frontend Telemetry**: A Next.js dashboard provides real-time visibility into the operational grid using Framer Motion for smooth transitions.
