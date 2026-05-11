from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency that automatically extracts and returns the raw string token.
    Strips 'Bearer ' and handles OpenAPI/Swagger setup.
    """
    return credentials.credentials
