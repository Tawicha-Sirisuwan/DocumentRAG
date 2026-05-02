import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    status = Column(String, default="pending", index=True) # pending, processing, ready, failed
    created_at = Column(DateTime, default=datetime.utcnow)
