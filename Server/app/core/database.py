from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# โหลดค่าจากไฟล์ .env
load_dotenv()

# ดึง URL สำหรับเชื่อมต่อฐานข้อมูลจาก .env
# ถ้าไม่มีค่า จะใช้ SQLite เป็นค่าเริ่มต้นชั่วคราวเพื่อป้องกัน Error
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

# สร้าง Engine สำหรับเชื่อมต่อ DB
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# สร้าง SessionLocal สำหรับใช้งานใน API (แยก Session ในแต่ละ Request)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# สร้าง Base Class สำหรับให้ Model ต่างๆ นำไปสืบทอด (Inherit)
Base = declarative_base()

# ฟังก์ชันสำหรับสร้างและปิด Database Session อัตโนมัติ (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
