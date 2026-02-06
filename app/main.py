from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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

    # Set up CORS middleware
    # support any render subdomain or local development
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex="https://.*\.onrender\.com|http://localhost:.*",
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
