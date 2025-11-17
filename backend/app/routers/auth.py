from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User
from app.schemas import UserSignup, UserLogin, UserResponse
from app.auth import (
    hash_password,
    verify_password,
    create_session,
    get_user_from_session,
    delete_session
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Cookie configuration
COOKIE_NAME = "session_id"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days in seconds


@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(user_data: UserSignup, response: Response, db: Session = Depends(get_db)):
    """
    Create a new user account.

    Args:
        user_data: User signup data (email, password)
        response: FastAPI Response object to set cookies
        db: Database session

    Returns:
        User data (without password)

    Raises:
        HTTPException 400: If email already registered
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create session
    session_id = create_session(new_user.id)

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False  # Set to True in production (HTTPS only)
    )

    return new_user


@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password.

    Args:
        credentials: Login credentials (email, password)
        response: FastAPI Response object to set cookies
        db: Database session

    Returns:
        User data (without password)

    Raises:
        HTTPException 401: If credentials are invalid
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create session
    session_id = create_session(user.id)

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False  # Set to True in production (HTTPS only)
    )

    return user


@router.post("/logout")
def logout(response: Response, session_id: Optional[str] = Cookie(None, alias=COOKIE_NAME)):
    """
    Logout and invalidate session.

    Args:
        response: FastAPI Response object to clear cookies
        session_id: Session ID from cookie

    Returns:
        Success message
    """
    # Delete session if it exists
    if session_id:
        delete_session(session_id)

    # Clear cookie
    response.delete_cookie(key=COOKIE_NAME, samesite="lax")

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user(
    db: Session = Depends(get_db),
    session_id: Optional[str] = Cookie(None, alias=COOKIE_NAME)
):
    """
    Get current user from session.

    Args:
        db: Database session
        session_id: Session ID from cookie

    Returns:
        Current user data

    Raises:
        HTTPException 401: If not authenticated
    """
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get user ID from session
    user_id = get_user_from_session(session_id)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
