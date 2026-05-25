from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # App
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

    # Quotes
    QUOTES_API_URL: str
    QUOTES_API_KEY: str

    # AI Insights
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    INSIGHTS_MAX_TOKENS: int = 500

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]

    # Dev-only toggles
    ENABLE_DEV_ROUTES: bool = False

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    class Config:
        env_file = ".env"


settings = Settings()
