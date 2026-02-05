import time
import logging
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger("workflow-platform.api")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log every incoming request and its performance.
    Adds a unique request ID to each log for traceabiliy.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.time()

        # Log request start
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
            },
        )

        response = await call_next(request)

        process_time = time.time() - start_time

        # Log request completion
        logger.info(
            f"Request finished: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {process_time:.4f}s",
            extra={
                "request_id": request_id,
                "status_code": response.status_code,
                "duration": process_time,
            },
        )

        response.headers["X-Request-ID"] = request_id
        return response
