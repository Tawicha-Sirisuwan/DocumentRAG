import os
import sys

# เพิ่ม Path ให้ Python รู้จักโมดูล app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
# ต้อง import Model เข้ามาเพื่อให้ SQLAlchemy รู้จักโครงสร้าง
from app.models.user import User
from app.models.document import Document
from app.models.chat import Chat
from app.models.message import Message
from app.models.document_chunk import DocumentChunk
print("Creating database tables...")

try:
    # คำสั่งสร้างตารางทั้งหมดที่ Inherit จาก Base (ถ้ามีอยู่แล้วจะไม่สร้างทับ)
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")
except Exception as e:
    print(f"❌ Error creating tables: {e}")
