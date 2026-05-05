from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import TokenData
from app.models.user import User

# แจ้งให้ Swagger UI รู้ว่าต้องเรียก API ไหนเวลากดปุ่ม Authorize (ตั้ง auto_error=False เผื่อว่าเราจะส่งผ่าน Cookie)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency สำหรับดึงข้อมูลผู้ใช้จาก Token
    จะค้นหาใน Header ก่อน หากไม่พบ จะค้นหาใน HttpOnly Cookie
    """
    # ตรวจสอบหา Token ใน Cookie หากใน Header ไม่มี
    if not token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token and cookie_token.startswith("Bearer "):
            token = cookie_token.split(" ")[1]

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ไม่สามารถยืนยันตัวตนได้ (Token ไม่ถูกต้อง หรือหมดอายุ)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
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
