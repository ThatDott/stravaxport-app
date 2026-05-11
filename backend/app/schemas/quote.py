from pydantic import BaseModel
from datetime import datetime
from typing import List

class Quote(BaseModel):
    id: int
    text: str
    author: str
    category: str

class DailyQuotes(BaseModel):
    quotes: List[Quote]
    date: datetime
