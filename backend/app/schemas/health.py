from pydantic import BaseModel

class HealthCheck(BaseModel):
    status: str
    timestamp: str
    version: str
