import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.deps import require_admin
from app.models.resource import Resource
from app.models.subject import Subject
from app.schemas.resource import ResourceResponse, ResourceUpdate

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("", response_model=List[ResourceResponse])
def get_resources(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    resource_type: Optional[str] = Query(None, description="Filter by type (pdf, video, article)"),
    search: Optional[str] = Query(None, description="Search by title or description"),
    level: Optional[str] = Query(None, description="Filter by subject level"),
    db: Session = Depends(get_db)
):
    query = db.query(Resource).join(Subject, Resource.subject_id == Subject.id)

    if subject_id:
        query = query.filter(Resource.subject_id == subject_id)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type.lower())
    if level and level != "All Levels":
        query = query.filter(Subject.level == level)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Resource.title.ilike(search_fmt)) | (Resource.description.ilike(search_fmt))
        )

    resources = query.order_by(Resource.created_at.desc()).all()
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    resource_type: str = Form(...),
    subject_id: int = Form(...),
    external_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=400, detail="Subject does not exist")

    if resource_type not in ["pdf", "video", "article"]:
        raise HTTPException(status_code=400, detail="Invalid resource type. Must be pdf, video, or article")

    file_path = None
    file_name = None
    file_size_bytes = None

    if file and file.filename:
        # Save file to uploads folder
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        target_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

        async with aiofiles.open(target_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        file_path = unique_filename
        file_name = file.filename
        file_size_bytes = len(content)

    resource = Resource(
        title=title,
        description=description,
        resource_type=resource_type,
        subject_id=subject_id,
        file_path=file_path,
        file_name=file_name,
        file_size_bytes=file_size_bytes,
        external_url=external_url
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    resource_in: ResourceUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = resource_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(resource, field, val)

    db.commit()
    db.refresh(resource)
    return resource

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.file_path:
        local_path = os.path.join(settings.UPLOAD_DIR, resource.file_path)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass

    db.delete(resource)
    db.commit()
    return None

@router.get("/{resource_id}/download")
def download_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.downloads_count += 1
    db.commit()

    if resource.file_path:
        local_path = os.path.join(settings.UPLOAD_DIR, resource.file_path)
        if os.path.exists(local_path):
            return FileResponse(
                path=local_path,
                filename=resource.file_name or os.path.basename(local_path),
                media_type="application/octet-stream"
            )

    if resource.external_url:
        return RedirectResponse(url=resource.external_url)

    raise HTTPException(status_code=404, detail="No downloadable content or link found for this resource")
