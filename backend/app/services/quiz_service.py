import random
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.option import Option
from app.models.attempt import QuizAttempt
from app.models.user import User
from app.schemas.quiz import (
    QuizTakeResponse, QuestionStudentResponse, OptionStudentResponse,
    QuizSubmission, QuizResultResponse, QuestionReviewItem, OptionReviewItem
)

def prepare_quiz_for_student(quiz: Quiz) -> QuizTakeResponse:
    """
    Shuffles questions and options randomly every time a quiz is started.
    Optionally picks N random questions if pick_random_count is configured.
    Strips out all correct answer information and explanations before sending to the client.
    """
    all_questions = list(quiz.questions)
    if not all_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz does not have any questions yet."
        )

    # Pick N random questions if configured, otherwise all
    if quiz.pick_random_count and 0 < quiz.pick_random_count < len(all_questions):
        selected_questions = random.sample(all_questions, quiz.pick_random_count)
    else:
        selected_questions = list(all_questions)

    # Shuffle question order
    random.shuffle(selected_questions)

    student_questions = []
    for q in selected_questions:
        opts = list(q.options)
        # Shuffle option order
        random.shuffle(opts)

        student_opts = [
            OptionStudentResponse(id=opt.id, text=opt.text)
            for opt in opts
        ]

        student_questions.append(
            QuestionStudentResponse(
                id=q.id,
                text=q.text,
                question_type=q.question_type or "single",
                options=student_opts
            )
        )

    return QuizTakeResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        subject=quiz.subject,
        duration_minutes=quiz.duration_minutes,
        passing_score_percentage=quiz.passing_score_percentage,
        total_questions=len(student_questions),
        questions=student_questions
    )

def evaluate_quiz_submission(db: Session, user: User, submission: QuizSubmission) -> QuizResultResponse:
    """
    Grading happens strictly on the backend.
    Evaluates submitted choices against true database values,
    calculates score & percentage, stores the attempt in database,
    and returns a full review with correct answers & explanations.
    """
    quiz = db.query(Quiz).filter(Quiz.id == submission.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    user_answers_map = {
        ans.question_id: set(ans.selected_option_ids)
        for ans in submission.answers
    }

    submitted_q_ids = list(user_answers_map.keys())
    if not submitted_q_ids:
        raise HTTPException(status_code=400, detail="No answers provided in submission")

    # Fetch relevant questions from DB
    questions = db.query(Question).filter(
        Question.id.in_(submitted_q_ids),
        Question.quiz_id == quiz.id
    ).all()

    question_map = {q.id: q for q in questions}

    total_questions = len(submitted_q_ids)
    earned_score = 0.0
    reviews = []

    for q_id in submitted_q_ids:
        q = question_map.get(q_id)
        if not q:
            continue

        user_selected_opts = user_answers_map.get(q_id, set())
        correct_opts = {opt.id for opt in q.options if opt.is_correct}

        # Check if user choices match correct options
        is_question_correct = (user_selected_opts == correct_opts) and len(correct_opts) > 0
        if is_question_correct:
            earned_score += 1.0

        option_reviews = [
            OptionReviewItem(
                id=opt.id,
                text=opt.text,
                is_correct=opt.is_correct,
                user_selected=(opt.id in user_selected_opts)
            )
            for opt in q.options
        ]

        reviews.append(
            QuestionReviewItem(
                question_id=q.id,
                text=q.text,
                question_type=q.question_type or "single",
                explanation=q.explanation,
                is_correct=is_question_correct,
                options=option_reviews
            )
        )

    percentage = round((earned_score / total_questions) * 100.0, 1) if total_questions > 0 else 0.0
    passed = percentage >= quiz.passing_score_percentage

    # Save attempt in database
    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz.id,
        score=earned_score,
        total_questions=total_questions,
        percentage=percentage,
        passed=passed,
        time_spent_seconds=submission.time_spent_seconds or 0,
        answers_json=json.dumps([r.model_dump() for r in reviews])
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=earned_score,
        total_questions=total_questions,
        percentage=percentage,
        passed=passed,
        passing_score_percentage=quiz.passing_score_percentage,
        time_spent_seconds=attempt.time_spent_seconds,
        created_at=attempt.created_at,
        reviews=reviews
    )
