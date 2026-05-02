from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.models.user import User
from app.models.schemas import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """สมัครสมาชิกใหม่"""
    # เช็คว่ามีอีเมลหรือชื่อผู้ใช้นี้อยู่แล้วหรือไม่ (เพื่อป้องกัน Big O ไม่ให้ช้า ให้ query คลุมทีเดียว)
    user_exist = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
    ).first()
    
    if user_exist:
        raise HTTPException(
            status_code=400,
            detail="อีเมลหรือชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว"
        )
        
    # Hash รหัสผ่านและบันทึกลง Database
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    เข้าสู่ระบบ (รับข้อมูลผ่าน Form URL Encoded ตามมาตรฐาน OAuth2)
    ผู้ใช้สามารถกรอก username เป็น 'Email' หรือ 'Username' ก็ได้
    """
    # ค้นหาโดยให้โอกาสเช็คทั้ง email และ username
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()
    
    # ถ้าหาไม่เจอ หรือ รหัสผ่านไม่ตรง
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="อีเมล/ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # เช็คสถานะแบน
    if not user.is_active:
        raise HTTPException(status_code=400, detail="บัญชีของคุณถูกระงับการใช้งาน")
        
    # นำ User ID ไปฝังไว้ใน Subject ของ Token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_active_user)):
    """
    ดึงข้อมูลโปรไฟล์ของตัวเอง (Protected Route ตัวอย่าง)
    - ถ้าส่ง Request ปกติโดยไม่มี Token -> โดนดีดออก 401
    - ถ้ามี Token จะคืนค่าข้อมูล User คนนั้นออกมา
    """
    return current_user
