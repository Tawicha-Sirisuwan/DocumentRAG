import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from datetime import datetime
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False) # 'user' หรือ 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True) # เก็บข้อมูลอ้างอิงเป็น JSON เพื่อให้ยืดหยุ่นและรองรับทั้ง PostgreSQL/SQLite
    created_at = Column(DateTime, default=datetime.utcnow)
