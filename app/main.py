from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from fastapi.responses import JSONResponse
from app.core.errors import setup_exception_handlers
from app.api.v1.router import api_router
from app.middleware.logging import LoggingMiddleware


def create_app() -> FastAPI:
    """
    Initialize and configure the FastAPI application.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Enterprise-grade Workflow Automation Platform API",
        version="0.1.0",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Set up Logging middleware
    app.add_middleware(LoggingMiddleware)

    # CRITICAL: Add a middleware wrapper to catch ALL exceptions (even 500s)
    # and ensure CORS headers are present. This prevents "Network Error" in browser.
    @app.middleware("http")
    async def add_cors_headers_on_error(request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # Log the crash here if needed
            print(f"CRASH: {exc}") 
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "error": str(exc)},
                headers={
                    "Access-Control-Allow-Origin": request.headers.get("origin") or "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )

    # Dynamic CORS for Render
    @app.middleware("http")
    async def dynamic_cors(request: Request, call_next):
        origin = request.headers.get("origin")
        if origin and ".onrender.com" in origin:
            if origin not in settings.BACKEND_CORS_ORIGINS:
                settings.BACKEND_CORS_ORIGINS.append(origin)
        return await call_next(request)

    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register global exception handlers
    setup_exception_handlers(app)

    # Register API routers
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/health", tags=["Health"])
    async def health_check():
        """
        Standard health check endpoint for monitoring tools.
        """
        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "version": "0.1.0",
        }

    @app.get("/debug/db", tags=["Debug"])
    async def debug_db():
        """
        Verify database connection and protocol.
        """
        try:
            from sqlalchemy import text
            from app.db.session import SessionLocal
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()
            return {"status": "connected", "protocol": settings.DATABASE_URL.split(":")[0]}
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": str(e), "url_masked": settings.DATABASE_URL.split("@")[-1]}
            )

    return app


app = create_app()
