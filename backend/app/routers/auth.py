import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.auth import (
    create_session,
    delete_session,
    get_user_from_session,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.oauth import GOOGLE_REDIRECT_URI, get_google_oauth_client, get_google_user_info
from app.schemas import UserLogin, UserResponse, UserSignup

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Cookie configuration
COOKIE_NAME = "session_id"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days in seconds

# OAuth state storage (CSRF protection)
# Format: {state: (timestamp, redirect_url)}
# In production, use Redis with TTL
oauth_states: dict[str, tuple[datetime, str]] = {}
STATE_EXPIRATION = timedelta(minutes=10)


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
    session_id = create_session(new_user.id)  # type: ignore[arg-type]

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False  # TODO: Set to True in production (HTTPS only)
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
    if not verify_password(credentials.password, user.password_hash):  # type: ignore[arg-type]
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create session
    session_id = create_session(user.id)  # type: ignore[arg-type]

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
def logout(response: Response, session_id: str | None = Cookie(None, alias=COOKIE_NAME)):
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
    session_id: str | None = Cookie(None, alias=COOKIE_NAME)
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


@router.get("/google/login")
async def google_login():
    """
    Initiate Google OAuth2 login flow.

    Generates authorization URL and redirects user to Google consent screen.
    Includes CSRF protection via state parameter.

    Returns:
        RedirectResponse: Redirect to Google authorization URL

    Raises:
        HTTPException 500: If Google OAuth is not configured
    """
    try:
        oauth = get_google_oauth_client()
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google OAuth not configured: {str(e)}"
        )

    # Generate random state for CSRF protection
    state = secrets.token_urlsafe(32)

    # Store state with timestamp (expires in 10 minutes)
    oauth_states[state] = (datetime.now(), "/dashboard")

    # Clean up expired states
    _cleanup_expired_states()

    # Generate authorization URL (use configured redirect URI from env)
    result = await oauth.google.create_authorization_url(  # type: ignore[union-attr]
        GOOGLE_REDIRECT_URI,
        state=state
    )

    # Extract URL from result (Authlib may return just URL or dict with 'url' key)
    if isinstance(result, dict):
        authorization_url = result.get("url", str(result))
    else:
        authorization_url = str(result)

    return RedirectResponse(url=authorization_url)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth2 callback.

    Validates state (CSRF), exchanges code for tokens, creates/links user,
    and creates session.

    Args:
        request: FastAPI Request object
        response: FastAPI Response object to set cookies
        code: Authorization code from Google
        state: State parameter for CSRF protection
        error: Error from Google (if user denied consent)
        db: Database session

    Returns:
        RedirectResponse: Redirect to dashboard on success

    Raises:
        HTTPException 400: If state is invalid or missing
        HTTPException 401: If token is invalid or user info cannot be retrieved
        HTTPException 500: If OAuth client is not configured
    """
    # Check if user denied consent
    if error:
        raise HTTPException(
            status_code=400,
            detail=f"Google authentication failed: {error}"
        )

    # Validate required parameters
    if not code or not state:
        raise HTTPException(
            status_code=400,
            detail="Missing code or state parameter"
        )

    # Validate state (CSRF protection)
    if state not in oauth_states:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired state parameter"
        )

    # Get redirect URL and remove state from storage
    _, redirect_url = oauth_states.pop(state)

    # Check state expiration
    # Note: Already validated by presence in dict (expired states are cleaned up)
    # TODO Certeza desse clean up? Porque ele foi feito na etapa anterior de enviar para a página de consentimento. 

    try:
        oauth = get_google_oauth_client()
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google OAuth not configured: {str(e)}"
        )

    # Exchange authorization code for tokens
    try:
        token = await oauth.google.authorize_access_token(request)  # type: ignore[union-attr]
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Failed to exchange authorization code: {str(e)}"
        )

    # Extract and verify ID token
    id_token = token.get("id_token")
    if not id_token:
        raise HTTPException(
            status_code=401,
            detail="No ID token received from Google"
        )

    # Get user info from ID token
    try:
        user_info = get_google_user_info(id_token)
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

    email = user_info["email"]
    google_id = user_info["google_id"]

    # Find or create user
    # 1. Try to find user by google_id
    user = db.query(User).filter(User.google_id == google_id).first()

    if not user:
        # 2. If not found, try to find by email (link existing account)
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Link existing account with Google
            user.google_id = google_id  # type: ignore[assignment]
            user.auth_provider = "google"  # type: ignore[assignment]
            db.commit()
            db.refresh(user)
        else:
            # 3. Create new user
            user = User(
                email=email,
                auth_provider="google",
                google_id=google_id,
                password_hash=None  # OAuth users don't need password
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Create session
    session_id = create_session(user.id)  # type: ignore[arg-type]

    # Set cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False  # TODO: Set to True in production (HTTPS only)
    )

    # Redirect to dashboard
    return RedirectResponse(url=redirect_url, status_code=303)


def _cleanup_expired_states():
    """Remove expired OAuth states (older than STATE_EXPIRATION)."""
    now = datetime.now()
    expired_keys = [
        state
        for state, (timestamp, _) in oauth_states.items()
        if now - timestamp > STATE_EXPIRATION
    ]
    for key in expired_keys:
        oauth_states.pop(key, None)
