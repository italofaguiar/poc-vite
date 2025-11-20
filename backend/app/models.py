from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    """
    User model for authentication.

    Supports multiple authentication methods:
    - Email/password (auth_provider="email")
    - Google OAuth (auth_provider="google")

    Attributes:
        id: Primary key
        email: User email (unique)
        password_hash: Bcrypt hashed password (optional for OAuth users)
        auth_provider: Authentication method ("email" or "google")
        google_id: Google user ID (unique, only for OAuth users)
        created_at: Timestamp of user creation
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # Optional for OAuth users
    auth_provider = Column(String, default="email", nullable=False)  # "email" or "google"
    google_id = Column(String, nullable=True, unique=True, index=True)  # Google user ID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
