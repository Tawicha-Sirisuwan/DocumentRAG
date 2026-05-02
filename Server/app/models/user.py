import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    # ใช้ UUID เพื่อความปลอดภัยและป้องกันการเดา ID
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # ข้อมูลสำหรับยืนยันตัวตน (ต้องเป็น Unique)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    
    # เก็บเฉพาะรหัสผ่านที่เข้ารหัสแล้วเท่านั้น
    hashed_password = Column(String, nullable=False)
    
    # สถานะของบัญชี
    is_active = Column(Boolean, default=True)      # สำหรับระงับบัญชี (Ban)
    is_superuser = Column(Boolean, default=False)  # สำหรับเช็คสิทธิ์แอดมิน
    
    # เวลาสร้างและอัปเดตข้อมูล
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
