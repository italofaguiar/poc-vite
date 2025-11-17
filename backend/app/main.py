from fastapi import FastAPI

from app.routers import auth, dashboard

# Create FastAPI app
app = FastAPI(
    title="PilotoDeVendas.IA API",
    description="Backend API for PilotoDeVendas.IA POC",
    version="0.1.0"
)

# CORS not needed - Vite proxy handles routing from same origin

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)


# Health check endpoint
@app.get("/", tags=["health"])
def health_check():
    """
    Health check endpoint.

    Returns:
        Status message
    """
    return {
        "status": "healthy",
        "service": "PilotoDeVendas.IA API",
        "version": "0.1.0"
    }
