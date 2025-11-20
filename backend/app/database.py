import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment variable
# Default:
# - Development (Docker Compose): PostgreSQL
# - Production (Cloud Run sem Cloud SQL): SQLite em memória
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/pilotodevendas"
)

# Se não houver DATABASE_URL configurado e não estiver acessível, usar SQLite
# (Cloud Run inicial antes de configurar Cloud SQL via Terraform)
try:
    # Tentar conectar ao PostgreSQL configurado
    engine = create_engine(DATABASE_URL)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback para SQLite em memória (Cloud Run sem Cloud SQL)
    print("⚠️  PostgreSQL not available, using SQLite in-memory (data will be lost on restart)")
    DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # Necessário para SQLite
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


# Dependency to get DB session
def get_db():
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
