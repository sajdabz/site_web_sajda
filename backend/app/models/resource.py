from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(String(20), nullable=False)  # "pdf", "video", "article"
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=True)  # stored relative to upload dir or filename
    file_name = Column(String(255), nullable=True)  # original uploaded file name
    file_size_bytes = Column(Integer, nullable=True)
    external_url = Column(String(500), nullable=True)  # URL for video or article
    downloads_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    subject = relationship("Subject", back_populates="resources")
