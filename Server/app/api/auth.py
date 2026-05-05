from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.models.user import User
from app.models.schemas import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_active_user
from app.core.config import settings

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
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """เข้าสู่ระบบ และนำ Token ฝังลงใน HttpOnly Cookie ป้องกัน XSS"""
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="อีเมล/ชื่อผู้ใช้งาน หรือ รหัสผ่าน ไม่ถูกต้อง",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="บัญชีของคุณถูกระงับการใช้งาน")
        
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # ฝัง JWT ลงใน HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,     # ป้องกันไม่ให้ JavaScript (XSS) เข้าถึงได้
        secure=False,      # บนโปรดักชันควรเปลี่ยนเป็น True (ใช้ HTTPS)
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    """ออกจากระบบ (ล้างค่า HttpOnly Cookie ทิ้ง)"""
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    return {"message": "ออกจากระบบสำเร็จ"}

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_active_user)):
    """
    ดึงข้อมูลโปรไฟล์ของตัวเอง (Protected Route ตัวอย่าง)
    - ถ้าส่ง Request ปกติโดยไม่มี Token -> โดนดีดออก 401
    - ถ้ามี Token จะคืนค่าข้อมูล User คนนั้นออกมา
    """
    return current_user
