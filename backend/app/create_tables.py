"""
Script to create database tables.
Run this before starting the application for the first time.

Usage:
    python -m app.create_tables
"""
from app.database import engine, Base
from app.models import User  # Import all models here


def create_tables():
    """Create all tables defined in models."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


if __name__ == "__main__":
    create_tables()
