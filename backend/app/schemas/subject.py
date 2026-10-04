from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None
    level: Optional[str] = "All Levels"
    icon: Optional[str] = "book"
    color: Optional[str] = "blue"

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    resources_count: Optional[int] = 0
    quizzes_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
