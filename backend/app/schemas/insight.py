from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict

class InsightMetric(BaseModel):
    metric_name: str
    current_value: float
    previous_value: float
    change_percentage: float

class AIInsight(BaseModel):
    insight_type: str
    title: str
    description: str
    metrics: List[InsightMetric]
    recommendations: List[str]

class InsightResponse(BaseModel):
    insights: List[AIInsight]
    generated_at: datetime
    period_compared: str
