from pydantic import BaseModel
from typing import Optional

class ExportRequest(BaseModel):
    activity_id: int
    format: str = "png"
    width: int = 1200
    height: int = 800
    include_map: bool = True
    include_stats: bool = True

class ExportResponse(BaseModel):
    image_url: str
    file_size: int
    format: str
