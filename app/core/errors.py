from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import (
    InvalidStateTransitionError,
    PermissionDeniedError,
    ResourceNotFoundError,
)


def setup_exception_handlers(app: FastAPI):
    """
    Register global exception handlers for the FastAPI application.
    maps custom domain exceptions to standard HTTP responses.
    """

    @app.exception_handler(InvalidStateTransitionError)
    async def state_transition_exception_handler(
        request: Request, exc: InvalidStateTransitionError
    ):
        return JSONResponse(
            status_code=400,
            content={
                "error": "INVALID_STATE_TRANSITION",
                "detail": str(exc),
                "type": "business_logic_error",
            },
        )

    @app.exception_handler(PermissionDeniedError)
    async def permission_denied_exception_handler(
        request: Request, exc: PermissionDeniedError
    ):
        return JSONResponse(
            status_code=403,
            content={
                "error": "PERMISSION_DENIED",
                "detail": str(exc),
                "type": "security_error",
            },
        )

    @app.exception_handler(ResourceNotFoundError)
    async def resource_not_found_exception_handler(
        request: Request, exc: ResourceNotFoundError
    ):
        return JSONResponse(
            status_code=404,
            content={
                "error": "RESOURCE_NOT_FOUND",
                "detail": str(exc),
                "type": "data_error",
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """
        Final fallback for unexpected errors.
        Ensures CORS headers are sent to prevent "Network Error" in frontend.
        """
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "detail": "An unexpected error occurred.",
                "type": "system_error",
                "message": str(exc) if not settings.is_production else "Contact support."
            },
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin") or "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
