from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    strava_id = Column(String, primary_key=True, unique=True)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    token_expires_at = Column(DateTime, nullable=False)
    
    activities = relationship("Activity", back_populates="user")
    ai_insights = relationship("AIInsight", back_populates="user")

class Activity(Base):
    __tablename__ = "activities"
    
    strava_activity_id = Column(String, primary_key=True)
    strava_id = Column(String, ForeignKey("users.strava_id"), nullable=False)
    raw_data = Column(JSON)
    metrics = Column(JSON)
    
    user = relationship("User", back_populates="activities")
    ai_insights = relationship("AIInsight", back_populates="activity")

class AIInsight(Base):
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    strava_id = Column(String, ForeignKey("users.strava_id"), nullable=False)
    activity_id = Column(String, ForeignKey("activities.strava_activity_id"), nullable=False)
    insight = Column(String, nullable=False)
    
    user = relationship("User", back_populates="ai_insights")
    activity = relationship("Activity", back_populates="ai_insights")
    
class DailyQuoteCache(Base):
    __tablename__ = "daily_quote_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quote = Column(String, nullable=False)
    author = Column(String, nullable=False)
    keyword = Column(String, nullable=False)
    cached_date = Column(String, nullable=False)
