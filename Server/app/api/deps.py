from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import TokenData
from app.models.user import User

# แจ้งให้ Swagger UI รู้ว่าต้องเรียก API ไหนเวลากดปุ่ม Authorize
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency สำหรับปกป้อง Route (Protected Route) 
    จะทำงานทุกครั้งที่มีคนเรียกใช้ API ที่ต้องการการยืนยันตัวตน
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ไม่สามารถยืนยันตัวตนได้ (Token ไม่ถูกต้อง หรือหมดอายุ)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # ถอดรหัส Token และดึง 'sub' (User ID) ออกมา
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(id=user_id)
    except JWTError:
        raise credentials_exception
        
    # ค้นหา User ในระบบว่ามีตัวตนจริงๆ หรือไม่
    user = db.query(User).filter(User.id == token_data.id).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    """ตรวจสอบเพิ่มเติมว่า User ไม่ได้ถูกแบน (Ban) อยู่"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="บัญชีของคุณถูกระงับการใช้งาน")
    return current_user
