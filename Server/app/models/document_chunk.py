import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Integer
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # เก็บข้อความที่หั่นออกมา
    page_content = Column(Text, nullable=False)
    
    # เก็บหน้าที่มาจาก PDF เพื่อใช้อ้างอิงตอนตอบกลับ
    page_number = Column(Integer, nullable=True) 
    
    # 768 คือจำนวนมิติ (Dimensions) ของโมเดล Google Gemini Embedding
    embedding = Column(Vector(768), nullable=False) 
