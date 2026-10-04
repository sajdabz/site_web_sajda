import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.subject import Subject
from app.models.attempt import QuizAttempt
from app.models.user import User
from app.schemas.quiz import (
    QuizStudentListResponse, QuizTakeResponse, QuizSubmission,
    QuizResultResponse
)
from app.schemas.attempt import AttemptListItem, DashboardStats
from app.services.quiz_service import prepare_quiz_for_student, evaluate_quiz_submission

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.get("", response_model=List[QuizStudentListResponse])
def get_quizzes(
    subject_id: Optional[int] = Query(None, description="Filter by subject"),
    search: Optional[str] = Query(None, description="Search quiz title"),
    db: Session = Depends(get_db)
):
    query = db.query(Quiz).filter(Quiz.is_published == True)

    if subject_id:
        query = query.filter(Quiz.subject_id == subject_id)
    if search:
        query = query.filter(Quiz.title.ilike(f"%{search}%"))

    quizzes = query.order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        q_count = len(q.questions)
        results.append(
            QuizStudentListResponse(
                id=q.id,
                title=q.title,
                description=q.description,
                subject_id=q.subject_id,
                duration_minutes=q.duration_minutes,
                passing_score_percentage=q.passing_score_percentage,
                pick_random_count=q.pick_random_count,
                is_published=q.is_published,
                created_at=q.created_at,
                questions_count=q.pick_random_count if (q.pick_random_count and q.pick_random_count < q_count) else q_count,
                subject=q.subject
            )
        )
    return results

@router.get("/{quiz_id}/start", response_model=QuizTakeResponse)
def start_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Starts a randomized quiz session.
    Every call shuffles questions, shuffles options,
    and strips correct answers and explanations.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.is_published == True).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found or not published")

    return prepare_quiz_for_student(quiz)

@router.post("/submit", response_model=QuizResultResponse)
def submit_quiz(
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Grades user answers strictly on the backend, saves attempt history,
    and returns score, percentage, correct answers, and full explanation review.
    """
    return evaluate_quiz_submission(db, current_user, submission)

@router.get("/attempts/my", response_model=List[AttemptListItem])
def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.created_at.desc()).all()

    results = []
    for att in attempts:
        results.append(
            AttemptListItem(
                id=att.id,
                quiz_id=att.quiz_id,
                quiz_title=att.quiz.title if att.quiz else "Deleted Quiz",
                subject_name=att.quiz.subject.name if (att.quiz and att.quiz.subject) else "General",
                subject_color=att.quiz.subject.color if (att.quiz and att.quiz.subject) else "blue",
                score=att.score,
                total_questions=att.total_questions,
                percentage=att.percentage,
                passed=att.passed,
                time_spent_seconds=att.time_spent_seconds,
                created_at=att.created_at
            )
        )
    return results

@router.get("/attempts/{attempt_id}", response_model=QuizResultResponse)
def get_attempt_detail(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    # Only student owner or admin can view this attempt
    if attempt.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this attempt")

    reviews = json.loads(attempt.answers_json) if attempt.answers_json else []

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        quiz_title=attempt.quiz.title if attempt.quiz else "Quiz",
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=attempt.percentage,
        passed=attempt.passed,
        passing_score_percentage=attempt.quiz.passing_score_percentage if attempt.quiz else 50,
        time_spent_seconds=attempt.time_spent_seconds,
        created_at=attempt.created_at,
        reviews=reviews
    )

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_student_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.created_at.desc()).all()

    total_attempts = len(attempts)
    quizzes_passed = sum(1 for a in attempts if a.passed)
    avg_score = round(sum(a.percentage for a in attempts) / total_attempts, 1) if total_attempts > 0 else 0.0

    recent_attempts = [
        AttemptListItem(
            id=att.id,
            quiz_id=att.quiz_id,
            quiz_title=att.quiz.title if att.quiz else "Quiz",
            subject_name=att.quiz.subject.name if (att.quiz and att.quiz.subject) else "General",
            subject_color=att.quiz.subject.color if (att.quiz and att.quiz.subject) else "blue",
            score=att.score,
            total_questions=att.total_questions,
            percentage=att.percentage,
            passed=att.passed,
            time_spent_seconds=att.time_spent_seconds,
            created_at=att.created_at
        )
        for att in attempts[:10]
    ]

    # Subject performance aggregation
    subject_map = {}
    for att in attempts:
        if att.quiz and att.quiz.subject:
            s_name = att.quiz.subject.name
            if s_name not in subject_map:
                subject_map[s_name] = {"count": 0, "total_score": 0.0, "color": att.quiz.subject.color}
            subject_map[s_name]["count"] += 1
            subject_map[s_name]["total_score"] += att.percentage

    subject_performance = [
        {
            "subject": s_name,
            "attempts": data["count"],
            "avg_score": round(data["total_score"] / data["count"], 1),
            "color": data["color"]
        }
        for s_name, data in subject_map.items()
    ]

    return DashboardStats(
        total_attempts=total_attempts,
        quizzes_passed=quizzes_passed,
        average_score=avg_score,
        recent_attempts=recent_attempts,
        subject_performance=subject_performance
    )
