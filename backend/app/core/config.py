from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Stravaxport API"
    VERSION: str = "1.0.0"
    
    # Strava OAuth
    STRAVA_CLIENT_ID: str
    STRAVA_CLIENT_SECRET: str
    STRAVA_REDIRECT_URI: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    
    class Config:
        env_file = ".env"

settings = Settings()
