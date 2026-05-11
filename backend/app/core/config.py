from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Stravaxport API"
    VERSION: str = "1.0.0"
    
    # Strava OAuth
    STRAVA_CLIENT_ID: str
    STRAVA_CLIENT_SECRET: str
    STRAVA_REDIRECT_URI: str
    
    class Config:
        env_file = ".env"

settings = Settings()
