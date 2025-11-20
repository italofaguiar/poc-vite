"""Unit tests for OAuth utilities (app/oauth.py)."""

import sys
from unittest.mock import MagicMock, Mock, patch

import pytest
from authlib.jose import JoseError


@pytest.fixture
def reload_oauth_module():
    """Reload oauth module to pick up new env vars."""
    if "app.oauth" in sys.modules:
        del sys.modules["app.oauth"]
    yield
    if "app.oauth" in sys.modules:
        del sys.modules["app.oauth"]


class TestGetGoogleOAuthClient:
    """Tests for get_google_oauth_client() function."""

    def test_success_with_valid_env_vars(self, google_oauth_env, reload_oauth_module):
        """Test OAuth client creation with valid environment variables."""
        from app.oauth import get_google_oauth_client

        oauth = get_google_oauth_client()

        assert oauth is not None
        assert hasattr(oauth, "google")
        assert oauth.google.client_id == "test-client-id.apps.googleusercontent.com"

    def test_failure_without_client_id(self, monkeypatch, reload_oauth_module):
        """Test OAuth client creation fails without GOOGLE_CLIENT_ID."""
        monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
        monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-secret")

        from app.oauth import get_google_oauth_client

        with pytest.raises(ValueError, match="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"):
            get_google_oauth_client()

    def test_failure_without_client_secret(self, monkeypatch, reload_oauth_module):
        """Test OAuth client creation fails without GOOGLE_CLIENT_SECRET."""
        monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
        monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)

        from app.oauth import get_google_oauth_client

        with pytest.raises(ValueError, match="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"):
            get_google_oauth_client()


class TestVerifyGoogleToken:
    """
    Tests for verify_google_token() function.

    Note: Full token validation flow (JWKS fetch, signature verification, etc.)
    is covered by integration tests (test_auth_integration.py).
    These unit tests focus on critical security validations.
    """

    @patch("app.oauth.requests.get")
    @patch("app.oauth.JsonWebToken")
    def test_failure_invalid_audience(
        self, mock_jwt_class, mock_requests_get, google_oauth_env, reload_oauth_module
    ):
        """Test token verification fails with wrong audience (client ID)."""
        from app.oauth import verify_google_token

        # Mock Google JWKS endpoint
        mock_response = Mock()
        mock_response.json.return_value = {"keys": []}
        mock_response.raise_for_status = Mock()
        mock_requests_get.return_value = mock_response

        # Mock JWT verification with wrong audience
        mock_jwt = MagicMock()
        mock_jwt_class.return_value = mock_jwt

        mock_claims = MagicMock()
        mock_claims.validate = Mock()
        mock_claims.__iter__ = Mock(
            return_value=iter(
                [
                    ("aud", "wrong-client-id"),
                    ("iss", "https://accounts.google.com"),
                ]
            )
        )
        mock_claims.get = lambda key, default=None: {
            "aud": "wrong-client-id",
            "iss": "https://accounts.google.com",
        }.get(key, default)

        mock_jwt.decode.return_value = mock_claims

        with pytest.raises(ValueError, match="Token audience does not match"):
            verify_google_token("token")

    @patch("app.oauth.requests.get")
    @patch("app.oauth.JsonWebToken")
    def test_failure_jose_error(
        self, mock_jwt_class, mock_requests_get, google_oauth_env, reload_oauth_module
    ):
        """Test token verification fails with JOSE error (invalid signature)."""
        from app.oauth import verify_google_token

        # Mock Google JWKS endpoint
        mock_response = Mock()
        mock_response.json.return_value = {"keys": []}
        mock_response.raise_for_status = Mock()
        mock_requests_get.return_value = mock_response

        # Mock JWT verification to raise JoseError
        mock_jwt = MagicMock()
        mock_jwt_class.return_value = mock_jwt
        mock_jwt.decode.side_effect = JoseError("Invalid signature")

        with pytest.raises(ValueError, match="Invalid token signature"):
            verify_google_token("token")


class TestGetGoogleUserInfo:
    """Tests for get_google_user_info() function."""

    @patch("app.oauth.verify_google_token")
    def test_success_with_all_claims(self, mock_verify, google_oauth_env, reload_oauth_module):
        """Test user info extraction with all claims present."""
        from app.oauth import get_google_user_info

        mock_verify.return_value = {
            "email": "test@example.com",
            "name": "Test User",
            "sub": "google-123",
            "picture": "https://example.com/photo.jpg",
        }

        user_info = get_google_user_info("token")

        assert user_info["email"] == "test@example.com"
        assert user_info["name"] == "Test User"
        assert user_info["google_id"] == "google-123"
        assert user_info["picture"] == "https://example.com/photo.jpg"

    @patch("app.oauth.verify_google_token")
    def test_failure_missing_email(self, mock_verify, google_oauth_env, reload_oauth_module):
        """Test user info extraction fails without email claim."""
        from app.oauth import get_google_user_info

        mock_verify.return_value = {
            "sub": "google-123",
            "name": "Test User",
        }

        with pytest.raises(ValueError, match="Token missing required claims"):
            get_google_user_info("token")

    @patch("app.oauth.verify_google_token")
    def test_failure_missing_sub(self, mock_verify, google_oauth_env, reload_oauth_module):
        """Test user info extraction fails without sub (google_id) claim."""
        from app.oauth import get_google_user_info

        mock_verify.return_value = {
            "email": "test@example.com",
            "name": "Test User",
        }

        with pytest.raises(ValueError, match="Token missing required claims"):
            get_google_user_info("token")

    @patch("app.oauth.verify_google_token")
    def test_propagates_verification_error(self, mock_verify, google_oauth_env, reload_oauth_module):
        """Test that token verification errors are propagated."""
        from app.oauth import get_google_user_info

        mock_verify.side_effect = ValueError("Invalid token")

        with pytest.raises(ValueError, match="Invalid token"):
            get_google_user_info("token")
