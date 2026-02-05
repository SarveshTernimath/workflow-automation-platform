from fastapi import APIRouter
from app.api.v1.endpoints import workflows, requests, users, roles, audit, admin, login, permissions

api_router = APIRouter()

api_router.include_router(workflows.router, prefix="/workflows", tags=["Workflows"])
api_router.include_router(requests.router, prefix="/requests", tags=["Requests"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(login.router, tags=["Login"])
