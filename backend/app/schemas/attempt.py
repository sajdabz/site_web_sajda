from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class AttemptListItem(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    subject_name: str
    subject_color: str
    score: float
    total_questions: int
    percentage: float
    passed: bool
    time_spent_seconds: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_attempts: int
    quizzes_passed: int
    average_score: float
    recent_attempts: List[AttemptListItem]
    subject_performance: List[dict]
