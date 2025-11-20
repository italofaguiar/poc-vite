"""
OAuth2 utilities for Google Sign-In.

This module provides functions to:
- Configure Google OAuth client
- Verify Google ID tokens
- Extract user information from tokens
"""

import os
from typing import Any

import requests
from authlib.integrations.starlette_client import OAuth
from authlib.jose import JoseError, JsonWebToken

# Google OAuth configuration from environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/api/auth/google/callback")

# Google's public keys for token verification (cached for performance)
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"


def get_google_oauth_client() -> OAuth:
    """
    Create and configure Authlib OAuth client for Google.

    Returns:
        OAuth: Configured Authlib OAuth client

    Raises:
        ValueError: If GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET are not set
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise ValueError(
            "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables"
        )

    oauth = OAuth()
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile",
            "redirect_uri": GOOGLE_REDIRECT_URI,
        },
    )

    return oauth


def verify_google_token(token: str) -> dict[str, Any]:
    """
    Verify Google ID token and extract claims.

    This function validates the token signature using Google's public keys
    and checks token expiration.

    Args:
        token: Google ID token (JWT) to verify

    Returns:
        dict: Token claims (email, name, sub, etc.)

    Raises:
        ValueError: If token is invalid or expired
        JoseError: If token signature verification fails
    """
    # Fetch Google's public keys (JWKS)
    try:
        response = requests.get(GOOGLE_JWKS_URL, timeout=5)
        response.raise_for_status()
        jwks = response.json()
    except requests.RequestException as e:
        raise ValueError(f"Failed to fetch Google's public keys: {e}") from e

    # Verify token signature and extract claims
    jwt = JsonWebToken(["RS256"])
    try:
        claims_obj = jwt.decode(token, jwks)
        # Validate token with Google's issuer and client ID
        claims_obj.validate(now=None, leeway=0)

        # Convert claims to dict for type safety
        claims: dict[str, Any] = dict(claims_obj)

        # Check audience (client ID) matches our app
        if claims.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Token audience does not match client ID")

        # Check issuer is Google
        if claims.get("iss") not in ["https://accounts.google.com", "accounts.google.com"]:
            raise ValueError("Token issuer is not Google")

        return claims
    except JoseError as e:
        raise ValueError(f"Invalid token signature: {e}") from e


def get_google_user_info(token: str) -> dict[str, str]:
    """
    Extract user information from verified Google ID token.

    Args:
        token: Verified Google ID token

    Returns:
        dict: User information with keys:
            - email: User email
            - name: User full name
            - google_id: Google user ID (sub claim)
            - picture: Profile picture URL (optional)

    Raises:
        ValueError: If token is invalid or missing required claims
    """
    claims = verify_google_token(token)

    # Extract required claims
    email = claims.get("email")
    name = claims.get("name")
    google_id = claims.get("sub")

    if not email or not google_id:
        raise ValueError("Token missing required claims (email or sub)")

    return {
        "email": email,
        "name": name or email.split("@")[0],  # Fallback to email username if name missing
        "google_id": google_id,
        "picture": str(claims.get("picture")) if claims.get("picture") else "",
    }
