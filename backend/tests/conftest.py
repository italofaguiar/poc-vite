"""Pytest configuration and shared fixtures."""

import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """
    Create a test database with in-memory SQLite for each test.

    Yields:
        Session: SQLAlchemy session connected to test database
    """
    # Create in-memory SQLite database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db: Session) -> TestClient:
    """
    Create FastAPI test client with test database.

    Args:
        test_db: Test database session

    Returns:
        TestClient: FastAPI test client
    """
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def google_oauth_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    Set up Google OAuth environment variables for testing.

    Args:
        monkeypatch: Pytest monkeypatch fixture
    """
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/api/auth/google/callback")


@pytest.fixture(scope="function", autouse=True)
def clear_oauth_client_cache() -> Generator[None, None, None]:
    """
    Clear OAuth client cache before/after each test.

    This ensures tests don't interfere with each other via cached OAuth clients.
    """
    # Clear any cached imports
    import sys
    if "app.oauth" in sys.modules:
        del sys.modules["app.oauth"]

    yield

    # Clear after test
    if "app.oauth" in sys.modules:
        del sys.modules["app.oauth"]
