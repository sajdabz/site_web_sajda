from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.schemas.subject import SubjectResponse

# Options
class OptionBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)

class OptionCreate(OptionBase):
    is_correct: bool = False

class OptionAdminResponse(OptionBase):
    id: int
    is_correct: bool

    model_config = ConfigDict(from_attributes=True)

class OptionStudentResponse(OptionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Questions
class QuestionBase(BaseModel):
    text: str = Field(..., min_length=3)
    explanation: Optional[str] = None
    question_type: str = Field(default="single", pattern="^(single|multiple)$")
    order_idx: Optional[int] = 0

class QuestionCreate(QuestionBase):
    options: List[OptionCreate] = Field(..., min_length=2, max_length=6)

class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    explanation: Optional[str] = None
    question_type: Optional[str] = None
    order_idx: Optional[int] = None
    options: Optional[List[OptionCreate]] = None

class QuestionAdminResponse(QuestionBase):
    id: int
    quiz_id: int
    options: List[OptionAdminResponse]

    model_config = ConfigDict(from_attributes=True)

class QuestionStudentResponse(BaseModel):
    id: int
    text: str
    question_type: str
    options: List[OptionStudentResponse]

    model_config = ConfigDict(from_attributes=True)

# Quizzes
class QuizBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    subject_id: int
    duration_minutes: Optional[int] = 15
    passing_score_percentage: Optional[int] = 50
    pick_random_count: Optional[int] = None
    is_published: Optional[bool] = True

class QuizCreate(QuizBase):
    questions: Optional[List[QuestionCreate]] = None

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    duration_minutes: Optional[int] = None
    passing_score_percentage: Optional[int] = None
    pick_random_count: Optional[int] = None
    is_published: Optional[bool] = None

class QuizStudentListResponse(QuizBase):
    id: int
    created_at: datetime
    questions_count: int
    subject: Optional[SubjectResponse] = None

    model_config = ConfigDict(from_attributes=True)

class QuizAdminResponse(QuizBase):
    id: int
    created_at: datetime
    questions: List[QuestionAdminResponse] = []
    subject: Optional[SubjectResponse] = None

    model_config = ConfigDict(from_attributes=True)

class QuizTakeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject: Optional[SubjectResponse] = None
    duration_minutes: Optional[int] = None
    passing_score_percentage: int
    total_questions: int
    questions: List[QuestionStudentResponse]

# Submission and Review
class QuestionAnswerItem(BaseModel):
    question_id: int
    selected_option_ids: List[int]

class QuizSubmission(BaseModel):
    quiz_id: int
    time_spent_seconds: Optional[int] = 0
    answers: List[QuestionAnswerItem]

class OptionReviewItem(BaseModel):
    id: int
    text: str
    is_correct: bool
    user_selected: bool

class QuestionReviewItem(BaseModel):
    question_id: int
    text: str
    question_type: str
    explanation: Optional[str] = None
    is_correct: bool
    options: List[OptionReviewItem]

class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    score: float
    total_questions: int
    percentage: float
    passed: bool
    passing_score_percentage: int
    time_spent_seconds: int
    created_at: datetime
    reviews: List[QuestionReviewItem]
