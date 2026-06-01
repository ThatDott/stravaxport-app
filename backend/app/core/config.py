from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # App
    PROJECT_NAME: str = "Stravaxport API"
    VERSION: str = "1.0.0"

    # Strava OAuth
    STRAVA_CLIENT_ID: str
    STRAVA_CLIENT_SECRET: str
    STRAVA_REDIRECT_URI: str = "http://localhost:4200/auth/callback"

    # Database
    DATABASE_URL: str

    # Quotes
    QUOTES_API_URL: str = "https://api.api-ninjas.com/v2/randomquotes?category=happiness&categories=inspirational%2C+nature%2C+courage"
    QUOTES_API_KEY: str = ""

    # AI Insights
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    INSIGHTS_MAX_TOKENS: int = 8192
    INSIGHTS_MAX_ACTIVITIES: int = 50

    class Config:
        env_file = ".env"


settings = Settings()
