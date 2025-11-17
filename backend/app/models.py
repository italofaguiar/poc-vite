from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """
    User model for authentication.

    Attributes:
        id: Primary key
        email: User email (unique)
        password_hash: Bcrypt hashed password
        created_at: Timestamp of user creation
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Create index on email for faster lookups
    __table_args__ = (
        Index('ix_users_email', 'email'),
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
