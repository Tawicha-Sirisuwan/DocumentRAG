import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # เพิ่ม document_id เพื่อให้ผูกแชทกับเอกสารใดเอกสารหนึ่งได้ (อนุญาตให้เป็น Null ได้ถ้าแชทคุยรวม)
    document_id = Column(String, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String, nullable=False, default="New Chat")
    is_pinned = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
