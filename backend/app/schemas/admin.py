from pydantic import BaseModel, Field
from typing import List, Optional

class AdminStatsResponse(BaseModel):
    total_users: int
    total_students: int
    total_admins: int
    total_subjects: int
    total_resources: int
    total_quizzes: int
    total_questions: int
    total_attempts: int
    average_score: float

class BulkOptionItem(BaseModel):
    text: str
    is_correct: bool = False

class BulkQuestionItem(BaseModel):
    text: str
    question_type: Optional[str] = "single"
    explanation: Optional[str] = None
    options: List[BulkOptionItem]

class BulkImportRequest(BaseModel):
    quiz_id: int
    questions: List[BulkQuestionItem]

class BulkImportResponse(BaseModel):
    message: str
    imported_count: int
