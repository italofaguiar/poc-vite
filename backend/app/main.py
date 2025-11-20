import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import FileResponse

from app.database import Base, engine
from app.routers import auth, dashboard

# Configure logging
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup: create database tables and validate environment variables
    Base.metadata.create_all(bind=engine)

    # Validate Google OAuth configuration
    if not os.getenv("GOOGLE_CLIENT_ID"):
        logger.warning("GOOGLE_CLIENT_ID não configurado - OAuth Google desabilitado")
    if not os.getenv("GOOGLE_CLIENT_SECRET"):
        logger.warning("GOOGLE_CLIENT_SECRET não configurado - OAuth Google desabilitado")

    # Log OAuth status
    if os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"):
        logger.info("Google OAuth configurado corretamente")
    else:
        logger.warning("Google OAuth não está totalmente configurado")

    yield
    # Shutdown: cleanup if needed (currently none)


# Create FastAPI app with lifespan handler
app = FastAPI(
    title="PilotoDeVendas.IA API",
    description="Backend API for PilotoDeVendas.IA POC",
    version="0.1.0",
    lifespan=lifespan
)

# Add SessionMiddleware for OAuth (Authlib requires it)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)


# CORS not needed - same origin in production, Vite proxy in dev

# Health check endpoint (used by Cloud Run and monitoring)
# Available in both dev and production
@app.get("/health", tags=["health"])
def health_check():
    """
    Health check endpoint for monitoring and orchestration platforms.

    Returns:
        dict: Service health status and metadata
    """
    static_dir = Path(__file__).parent.parent / "static"
    mode = "production" if static_dir.exists() else "development"

    return {
        "status": "healthy",
        "service": "PilotoDeVendas.IA API",
        "version": "0.1.0",
        "mode": mode
    }


# Include routers (API routes must come before static files)
app.include_router(auth.router)
app.include_router(dashboard.router)

# Serve static files in production (when STATIC_DIR exists)
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists() and STATIC_DIR.is_dir():
    # Mount static assets (CSS, JS, images, etc.)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    # Serve index.html for all non-API routes (SPA fallback)
    @app.get("/{full_path:path}", tags=["spa"])
    async def serve_spa(full_path: str):
        """
        Serve SPA for all non-API routes.
        Falls back to index.html for client-side routing.
        """
        # Check if file exists in static dir
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)

        # Fallback to index.html for SPA routing
        return FileResponse(STATIC_DIR / "index.html")
