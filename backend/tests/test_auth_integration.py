"""Integration tests for authentication flows (OAuth + Email/Password)."""

from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi.testclient import TestClient

from app.auth import create_session, hash_password
from app.models import User


class TestGoogleOAuthLinking:
    """Test Google OAuth linking with existing email/password accounts."""

    @patch("app.routers.auth.get_google_oauth_client")
    @patch("app.routers.auth.get_google_user_info")
    def test_link_existing_email_password_user(
        self, mock_get_user_info, mock_get_oauth_client, client, test_db
    ):
        """
        Test that logging in with Google links an existing email/password account.

        Scenario:
        1. User creates account with email/password (user@example.com)
        2. User logs in with Google (same email: user@example.com)
        3. Backend should LINK the account (add google_id), not create duplicate

        Expected:
        - User's google_id is populated
        - User's auth_provider is updated to "google"
        - Only ONE user exists in database
        - Session is created
        - Cookie is set
        """
        # 1. Create user with email/password
        existing_user = User(
            email="user@example.com",
            password_hash=hash_password("password123"),
            auth_provider="email",
            google_id=None,
        )
        test_db.add(existing_user)
        test_db.commit()
        test_db.refresh(existing_user)

        # Store original user ID
        original_user_id = existing_user.id

        # 2. Mock Google OAuth client
        mock_oauth = MagicMock()
        mock_google = MagicMock()

        # Mock authorize_access_token to return token with id_token
        async def mock_authorize_access_token(request):
            return {"id_token": "mock.jwt.token", "access_token": "mock-access-token"}

        mock_google.authorize_access_token = AsyncMock(side_effect=mock_authorize_access_token)
        mock_oauth.google = mock_google
        mock_get_oauth_client.return_value = mock_oauth

        # 3. Mock get_google_user_info to return user data
        mock_get_user_info.return_value = {
            "email": "user@example.com",  # Same email as existing user
            "name": "Test User",
            "google_id": "google-id-12345",
            "picture": "https://example.com/photo.jpg",
        }

        # 4. Call Google OAuth callback
        response = client.get(
            "/api/auth/google/callback",
            params={"code": "mock-auth-code", "state": "mock-state"},
            follow_redirects=False,
        )

        # 5. Assertions
        assert response.status_code == 302, f"Expected 302 redirect, got {response.status_code}"
        assert response.headers["location"] == "/dashboard"

        # Verify cookie was set
        assert "session_id" in response.cookies

        # Verify user was linked (not duplicated)
        users = test_db.query(User).filter(User.email == "user@example.com").all()
        assert len(users) == 1, "Should have exactly ONE user (no duplicate created)"

        linked_user = users[0]
        assert linked_user.id == original_user_id, "User ID should remain the same"
        assert linked_user.google_id == "google-id-12345", "google_id should be populated"
        assert linked_user.auth_provider == "google", "auth_provider should be updated to 'google'"
        assert linked_user.email == "user@example.com"

        # Verify session was created
        session_id = response.cookies["session_id"]
        assert session_id is not None

    @patch("app.routers.auth.get_google_oauth_client")
    @patch("app.routers.auth.get_google_user_info")
    def test_create_new_user_via_google(
        self, mock_get_user_info, mock_get_oauth_client, client, test_db
    ):
        """
        Test that logging in with Google creates a new user if email doesn't exist.

        Scenario:
        1. User logs in with Google (newuser@example.com)
        2. Email doesn't exist in database
        3. Backend should CREATE new user with google_id

        Expected:
        - New user is created
        - User has google_id populated
        - User has auth_provider = "google"
        - User has NO password_hash (OAuth user)
        - Session is created
        - Cookie is set
        """
        # 1. Mock Google OAuth client
        mock_oauth = MagicMock()
        mock_google = MagicMock()

        async def mock_authorize_access_token(request):
            return {"id_token": "mock.jwt.token", "access_token": "mock-access-token"}

        mock_google.authorize_access_token = AsyncMock(side_effect=mock_authorize_access_token)
        mock_oauth.google = mock_google
        mock_get_oauth_client.return_value = mock_oauth

        # 2. Mock get_google_user_info to return user data
        mock_get_user_info.return_value = {
            "email": "newuser@example.com",  # New email (doesn't exist)
            "name": "New User",
            "google_id": "google-id-67890",
            "picture": "https://example.com/photo2.jpg",
        }

        # 3. Call Google OAuth callback
        response = client.get(
            "/api/auth/google/callback",
            params={"code": "mock-auth-code", "state": "mock-state"},
            follow_redirects=False,
        )

        # 4. Assertions
        assert response.status_code == 302, f"Expected 302 redirect, got {response.status_code}"
        assert response.headers["location"] == "/dashboard"

        # Verify cookie was set
        assert "session_id" in response.cookies

        # Verify new user was created
        users = test_db.query(User).filter(User.email == "newuser@example.com").all()
        assert len(users) == 1, "Should have exactly ONE new user"

        new_user = users[0]
        assert new_user.google_id == "google-id-67890"
        assert new_user.auth_provider == "google"
        assert new_user.password_hash is None, "OAuth users should not have password_hash"
        assert new_user.email == "newuser@example.com"

        # Verify session was created
        session_id = response.cookies["session_id"]
        assert session_id is not None

    @patch("app.routers.auth.get_google_oauth_client")
    @patch("app.routers.auth.get_google_user_info")
    def test_login_existing_google_user(
        self, mock_get_user_info, mock_get_oauth_client, client, test_db
    ):
        """
        Test that logging in with Google works for existing Google users.

        Scenario:
        1. User already has Google account (google_id populated)
        2. User logs in with Google again
        3. Backend should find user by google_id and create session

        Expected:
        - User is found by google_id
        - Session is created
        - Cookie is set
        - No user modifications (already linked)
        """
        # 1. Create user with Google account
        google_user = User(
            email="googleuser@example.com",
            password_hash=None,  # OAuth user
            auth_provider="google",
            google_id="google-id-existing",
        )
        test_db.add(google_user)
        test_db.commit()
        test_db.refresh(google_user)

        # 2. Mock Google OAuth client
        mock_oauth = MagicMock()
        mock_google = MagicMock()

        async def mock_authorize_access_token(request):
            return {"id_token": "mock.jwt.token", "access_token": "mock-access-token"}

        mock_google.authorize_access_token = AsyncMock(side_effect=mock_authorize_access_token)
        mock_oauth.google = mock_google
        mock_get_oauth_client.return_value = mock_oauth

        # 3. Mock get_google_user_info to return same user data
        mock_get_user_info.return_value = {
            "email": "googleuser@example.com",
            "name": "Google User",
            "google_id": "google-id-existing",  # Same google_id
            "picture": "https://example.com/photo3.jpg",
        }

        # 4. Call Google OAuth callback
        response = client.get(
            "/api/auth/google/callback",
            params={"code": "mock-auth-code", "state": "mock-state"},
            follow_redirects=False,
        )

        # 5. Assertions
        assert response.status_code == 302
        assert response.headers["location"] == "/dashboard"

        # Verify cookie was set
        assert "session_id" in response.cookies

        # Verify user was found (not created or modified)
        users = test_db.query(User).filter(User.email == "googleuser@example.com").all()
        assert len(users) == 1
        assert users[0].id == google_user.id  # Same user


class TestEmailPasswordAuth:
    """Test email/password authentication flow."""

    def test_signup_and_login(self, client, test_db):
        """
        Test complete signup and login flow with email/password.

        Scenario:
        1. User signs up with email/password
        2. User logs out
        3. User logs in with same credentials

        Expected:
        - Signup creates user and session
        - Login finds user and creates new session
        - Passwords are hashed (not stored in plaintext)
        """
        # 1. Signup
        signup_response = client.post(
            "/api/auth/signup", json={"email": "test@example.com", "password": "SecurePass123"}
        )

        assert signup_response.status_code == 201
        assert signup_response.json()["email"] == "test@example.com"
        assert signup_response.json()["auth_provider"] == "email"
        assert "session_id" in signup_response.cookies

        # Verify user was created in database
        user = test_db.query(User).filter(User.email == "test@example.com").first()
        assert user is not None
        assert user.password_hash is not None
        assert user.password_hash != "SecurePass123"  # Password should be hashed
        assert user.auth_provider == "email"
        assert user.google_id is None

        # 2. Logout
        logout_response = client.post("/api/auth/logout")
        assert logout_response.status_code == 200

        # 3. Login with same credentials
        login_response = client.post(
            "/api/auth/login", json={"email": "test@example.com", "password": "SecurePass123"}
        )

        assert login_response.status_code == 200
        assert login_response.json()["email"] == "test@example.com"
        assert "session_id" in login_response.cookies

    def test_login_wrong_password(self, client, test_db):
        """Test that login fails with wrong password."""
        # Create user
        user = User(
            email="user@example.com",
            password_hash=hash_password("CorrectPassword123"),
            auth_provider="email",
        )
        test_db.add(user)
        test_db.commit()

        # Try to login with wrong password
        response = client.post(
            "/api/auth/login", json={"email": "user@example.com", "password": "WrongPassword"}
        )

        assert response.status_code == 401
        assert "session_id" not in response.cookies
