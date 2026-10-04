from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.subject import Subject
from app.models.resource import Resource
from app.models.quiz import Quiz
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).order_by(Subject.name.asc()).all()
    results = []
    for s in subjects:
        r_count = db.query(Resource).filter(Resource.subject_id == s.id).count()
        q_count = db.query(Quiz).filter(Quiz.subject_id == s.id, Quiz.is_published == True).count()
        resp = SubjectResponse(
            id=s.id,
            name=s.name,
            code=s.code,
            description=s.description,
            level=s.level,
            icon=s.icon,
            color=s.color,
            created_at=s.created_at,
            resources_count=r_count,
            quizzes_count=q_count
        )
        results.append(resp)
    return results

@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    r_count = db.query(Resource).filter(Resource.subject_id == subject.id).count()
    q_count = db.query(Quiz).filter(Quiz.subject_id == subject.id).count()
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        level=subject.level,
        icon=subject.icon,
        color=subject.color,
        created_at=subject.created_at,
        resources_count=r_count,
        quizzes_count=q_count
    )

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    if db.query(Subject).filter(Subject.name == subject_in.name).first():
        raise HTTPException(status_code=400, detail="A subject with this name already exists")
    if db.query(Subject).filter(Subject.code == subject_in.code).first():
        raise HTTPException(status_code=400, detail="A subject with this code already exists")

    subject = Subject(**subject_in.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        level=subject.level,
        icon=subject.icon,
        color=subject.color,
        created_at=subject.created_at,
        resources_count=0,
        quizzes_count=0
    )

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_in: SubjectUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    update_data = subject_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(subject, field, val)

    db.commit()
    db.refresh(subject)
    r_count = db.query(Resource).filter(Resource.subject_id == subject.id).count()
    q_count = db.query(Quiz).filter(Quiz.subject_id == subject.id).count()
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        level=subject.level,
        icon=subject.icon,
        color=subject.color,
        created_at=subject.created_at,
        resources_count=r_count,
        quizzes_count=q_count
    )

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return None
