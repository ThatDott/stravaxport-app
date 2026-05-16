import requests
from urllib.parse import urlencode
from fastapi import HTTPException, status
from app.core.config import settings

class AuthService:
    
    @staticmethod
    def get_strava_auth_url() -> str:
        """
        Generates the Strava OAuth URL to redirect the user to.
        """
        base_url = "https://www.strava.com/oauth/authorize"
        params = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "redirect_uri": settings.STRAVA_REDIRECT_URI,
            "response_type": "code",
            "approval_prompt": "force",
            "scope": "read,activity:read_all,profile:read_all" 
        }
        return f"{base_url}?{urlencode(params)}"

    @staticmethod
    def exchange_token(authorization_code: str) -> dict:
        """
        Exchanges the temporary code for access and refresh tokens.
        """
        url = "https://www.strava.com/oauth/token"
        payload = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "code": authorization_code,
            "grant_type": "authorization_code"
        }
        
        response = requests.post(url, data=payload)
        data = response.json()
        
        # Guard clause: Fail immediately if Strava returns an error
        if response.status_code != 200 or "errors" in data or "error" in data:
            error_msg = data.get("message", "Unknown Strava OAuth error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Strava token exchange failed: {error_msg}"
            )
        
        return {
            "access_token": data.get("access_token"),
            "refresh_token": data.get("refresh_token"),
            "expires_at": data.get("expires_at"),
            "strava_id": str(data.get("athlete", {}).get("id", ""))
        }

    @staticmethod
    async def handle_strava_callback(code: str) -> dict:
        """
        Handles the callback logic from FastAPI, orchestrating the token exchange.
        """
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Authorization code missing from Strava redirect."
            )
            
        # Exchange the code for actual tokens
        tokens = AuthService.exchange_token(code)
        
        return tokens
