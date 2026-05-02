from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# ---- Schema สำหรับ User ----
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    # ช่วยให้ Pydantic แปลงจาก SQLAlchemy Model เป็น JSON ได้อัตโนมัติ
    class Config:
        from_attributes = True

# ---- Schema สำหรับ Auth / JWT Token ----
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[str] = None
