import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.subject import Subject
from app.models.resource import Resource
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.option import Option
from app.models.attempt import QuizAttempt
from app.schemas.admin import AdminStatsResponse, BulkImportRequest, BulkImportResponse, BulkQuestionItem
from app.schemas.user import UserResponse
from app.schemas.quiz import (
    QuizAdminResponse, QuizCreate, QuizUpdate,
    QuestionAdminResponse, QuestionCreate, QuestionUpdate, OptionCreate
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_subjects = db.query(Subject).count()
    total_resources = db.query(Resource).count()
    total_quizzes = db.query(Quiz).count()
    total_questions = db.query(Question).count()
    total_attempts = db.query(QuizAttempt).count()

    avg_score = db.query(func.avg(QuizAttempt.percentage)).scalar()
    avg_score_val = round(float(avg_score), 1) if avg_score is not None else 0.0

    return AdminStatsResponse(
        total_users=total_users,
        total_students=total_students,
        total_admins=total_admins,
        total_subjects=total_subjects,
        total_resources=total_resources,
        total_quizzes=total_quizzes,
        total_questions=total_questions,
        total_attempts=total_attempts,
        average_score=avg_score_val
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.put("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(user_id: int, role: str, db: Session = Depends(get_db)):
    if role not in ["student", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be either student or admin")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@router.get("/quizzes", response_model=List[QuizAdminResponse])
def get_all_quizzes_admin(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).order_by(Quiz.created_at.desc()).all()
    return quizzes

@router.get("/quizzes/{quiz_id}", response_model=QuizAdminResponse)
def get_quiz_admin(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/quizzes", response_model=QuizAdminResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_admin(quiz_in: QuizCreate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == quiz_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Invalid subject ID")

    quiz = Quiz(
        title=quiz_in.title,
        description=quiz_in.description,
        subject_id=quiz_in.subject_id,
        duration_minutes=quiz_in.duration_minutes,
        passing_score_percentage=quiz_in.passing_score_percentage,
        pick_random_count=quiz_in.pick_random_count,
        is_published=quiz_in.is_published
    )
    db.add(quiz)
    db.flush()

    if quiz_in.questions:
        for q_idx, q_data in enumerate(quiz_in.questions):
            question = Question(
                quiz_id=quiz.id,
                text=q_data.text,
                explanation=q_data.explanation,
                question_type=q_data.question_type or "single",
                order_idx=q_data.order_idx or q_idx
            )
            db.add(question)
            db.flush()

            for opt_data in q_data.options:
                option = Option(
                    question_id=question.id,
                    text=opt_data.text,
                    is_correct=opt_data.is_correct
                )
                db.add(option)

    db.commit()
    db.refresh(quiz)
    return quiz

@router.put("/quizzes/{quiz_id}", response_model=QuizAdminResponse)
def update_quiz_admin(quiz_id: int, quiz_in: QuizUpdate, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    update_data = quiz_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(quiz, field, val)

    db.commit()
    db.refresh(quiz)
    return quiz

@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz_admin(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return None

@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionAdminResponse, status_code=status.HTTP_201_CREATED)
def add_question_to_quiz(quiz_id: int, question_in: QuestionCreate, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    correct_opts = [opt for opt in question_in.options if opt.is_correct]
    if not correct_opts:
        raise HTTPException(status_code=400, detail="At least one option must be marked as correct")

    question = Question(
        quiz_id=quiz.id,
        text=question_in.text,
        explanation=question_in.explanation,
        question_type=question_in.question_type,
        order_idx=question_in.order_idx or len(quiz.questions)
    )
    db.add(question)
    db.flush()

    for opt in question_in.options:
        option = Option(
            question_id=question.id,
            text=opt.text,
            is_correct=opt.is_correct
        )
        db.add(option)

    db.commit()
    db.refresh(question)
    return question

@router.put("/questions/{question_id}", response_model=QuestionAdminResponse)
def update_question_admin(question_id: int, question_in: QuestionUpdate, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question_in.text is not None:
        question.text = question_in.text
    if question_in.explanation is not None:
        question.explanation = question_in.explanation
    if question_in.question_type is not None:
        question.question_type = question_in.question_type
    if question_in.order_idx is not None:
        question.order_idx = question_in.order_idx

    if question_in.options is not None:
        correct_opts = [opt for opt in question_in.options if opt.is_correct]
        if not correct_opts:
            raise HTTPException(status_code=400, detail="At least one option must be marked as correct")

        # Replace existing options
        db.query(Option).filter(Option.question_id == question.id).delete()
        for opt_data in question_in.options:
            option = Option(
                question_id=question.id,
                text=opt_data.text,
                is_correct=opt_data.is_correct
            )
            db.add(option)

    db.commit()
    db.refresh(question)
    return question

@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question_admin(question_id: int, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return None

@router.post("/quizzes/{quiz_id}/bulk-import-json", response_model=BulkImportResponse)
def bulk_import_questions_json(
    quiz_id: int,
    payload: List[BulkQuestionItem],
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    imported = 0
    current_count = len(quiz.questions)
    for q_item in payload:
        if len(q_item.options) < 2:
            continue
        has_correct = any(opt.is_correct for opt in q_item.options)
        if not has_correct:
            continue

        q = Question(
            quiz_id=quiz.id,
            text=q_item.text,
            explanation=q_item.explanation,
            question_type=q_item.question_type or "single",
            order_idx=current_count + imported
        )
        db.add(q)
        db.flush()

        for opt in q_item.options:
            db.add(Option(
                question_id=q.id,
                text=opt.text,
                is_correct=opt.is_correct
            ))

        imported += 1

    db.commit()
    return BulkImportResponse(
        message=f"Successfully imported {imported} questions into quiz.",
        imported_count=imported
    )

@router.post("/quizzes/{quiz_id}/bulk-import-csv", response_model=BulkImportResponse)
async def bulk_import_questions_csv(
    quiz_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    CSV Format expected:
    question,question_type,explanation,option1,is_correct1,option2,is_correct2,option3,is_correct3,option4,is_correct4
    where is_correct is true/1/yes or false/0/no.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    content_bytes = await file.read()
    text = content_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.reader(io.StringIO(text))

    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty")

    header = [h.strip().lower() for h in rows[0]]
    data_rows = rows[1:]

    imported = 0
    current_count = len(quiz.questions)

    for row in data_rows:
        if not row or not any(row):
            continue
        # Check standard columns
        q_text = row[0].strip()
        q_type = row[1].strip() if len(row) > 1 and row[1].strip() in ["single", "multiple"] else "single"
        explanation = row[2].strip() if len(row) > 2 else None

        options = []
        # Remaining columns in pairs of (text, is_correct)
        idx = 3
        while idx < len(row):
            opt_text = row[idx].strip() if idx < len(row) else ""
            opt_corr_str = row[idx+1].strip().lower() if (idx+1) < len(row) else "false"
            idx += 2
            if opt_text:
                is_correct = opt_corr_str in ["true", "1", "yes", "correct", "t", "vrai"]
                options.append(OptionCreate(text=opt_text, is_correct=is_correct))

        if len(options) >= 2 and any(o.is_correct for o in options):
            q = Question(
                quiz_id=quiz.id,
                text=q_text,
                explanation=explanation,
                question_type=q_type,
                order_idx=current_count + imported
            )
            db.add(q)
            db.flush()
            for opt in options:
                db.add(Option(
                    question_id=q.id,
                    text=opt.text,
                    is_correct=opt.is_correct
                ))
            imported += 1

    db.commit()
    return BulkImportResponse(
        message=f"Successfully parsed and imported {imported} questions from CSV.",
        imported_count=imported
    )
