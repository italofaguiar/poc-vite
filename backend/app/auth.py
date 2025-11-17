import os
from datetime import datetime, timedelta
from typing import Any

from itsdangerous import URLSafeTimedSerializer
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Session serializer
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
session_serializer = URLSafeTimedSerializer(SECRET_KEY)

# In-memory session storage (TODO: use Redis in production)
# Format: {session_id: {"user_id": int, "created_at": datetime}}
sessions: dict[str, dict[str, Any]] = {}

# Session expiration time (7 days)
SESSION_EXPIRATION = timedelta(days=7)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)  # type: ignore[no-any-return]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to compare against

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)  # type: ignore[no-any-return]


def create_session(user_id: int) -> str:
    """
    Create a new session for a user.

    Args:
        user_id: ID of the user

    Returns:
        Session ID (signed token)
    """
    # Create session data
    session_data = {
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat()
    }

    # Generate signed session ID
    session_id = session_serializer.dumps(session_data)

    # Store session in memory
    sessions[session_id] = {
        "user_id": user_id,
        "created_at": datetime.utcnow()
    }

    return session_id


def get_user_from_session(session_id: str) -> int | None:
    """
    Get user ID from session.

    Args:
        session_id: Session ID to validate

    Returns:
        User ID if session is valid, None otherwise
    """
    # Check if session exists in memory
    if session_id not in sessions:
        return None

    session_data = sessions[session_id]
    created_at: datetime = session_data["created_at"]

    # Check if session has expired
    if datetime.utcnow() - created_at > SESSION_EXPIRATION:
        # Session expired, delete it
        delete_session(session_id)
        return None

    user_id: int = session_data["user_id"]
    return user_id


def delete_session(session_id: str) -> bool:
    """
    Delete a session (logout).

    Args:
        session_id: Session ID to delete

    Returns:
        True if session was deleted, False if it didn't exist
    """
    if session_id in sessions:
        del sessions[session_id]
        return True
    return False
