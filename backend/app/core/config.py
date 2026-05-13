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
    ZENQUOTES_API_URL: str = "https://zenquotes.io/api"

    # AI Insights
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    INSIGHTS_MAX_TOKENS: int = 500

    class Config:
        env_file = ".env"


settings = Settings()