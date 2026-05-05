import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "DocumentRAG API"
    # ดึงค่า URL Database (ใช้ค่าจาก .env ถ้ามี)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # Secret Key สำหรับเซ็น JWT Token ห้ามหลุดเด็ดขาด (ควรไปใส่ใน .env ในโปรดักชัน)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-for-document-rag-project")
    ALGORITHM: str = "HS256"
    # เวลาหมดอายุของ Token (ตั้งไว้ 7 วัน)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 
    
    # Gemini API Key สำหรับระบบ RAG
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
