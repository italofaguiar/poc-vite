from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth

# Create FastAPI app
app = FastAPI(
    title="PilotoDeVendas.IA API",
    description="Backend API for PilotoDeVendas.IA POC",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",  # Alternative localhost
    ],
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(auth.router)


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
