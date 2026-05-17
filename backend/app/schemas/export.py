from pydantic import BaseModel
from typing import Optional

class ExportCreateRequest(BaseModel):
    activity_id: int
    format: str = "png"

class ExportResponse(BaseModel):
    image_url: str
    file_size: int
    format: str
