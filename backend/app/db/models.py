from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    strava_id = Column(String, primary_key=True, unique=True)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    token_expires_at = Column(DateTime, nullable=False)

    activities = relationship("Activity", back_populates="user")

    # One-to-one: each user has at most one cached insight set
    ai_insight = relationship("AIInsight", back_populates="user", uselist=False)


class Activity(Base):
    __tablename__ = "activities"

    strava_activity_id = Column(String, primary_key=True)
    strava_id = Column(String, ForeignKey("users.strava_id"), nullable=False)
    raw_data = Column(JSON)
    metrics = Column(JSON)

    user = relationship("User", back_populates="activities")


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, autoincrement=True)

    strava_id = Column(String, ForeignKey("users.strava_id"), nullable=False, unique=True)

    insights = Column(JSON, nullable=False)

    generated_at = Column(DateTime, nullable=False)

    # Cache flag — set to False by sync_activities_to_db when new activities land.
    # On next login, False triggers regeneration via Gemini instead of serving stale cache.
    is_valid = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="ai_insight")


class DailyQuoteCache(Base):
    __tablename__ = "daily_quote_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quote = Column(String, nullable=False)
    author = Column(String, nullable=False)
    keyword = Column(String, nullable=False)
    cached_date = Column(String, nullable=False)
