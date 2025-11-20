from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    """Schema for user signup."""
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (excludes password)."""
    id: int
    email: str
    auth_provider: str  # "email" or "google"
    created_at: datetime

    class Config:
        from_attributes = True  # Allows SQLAlchemy models to be converted to Pydantic models
