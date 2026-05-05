from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth
from app.api import document
from app.api import chat_api
from app.core.database import engine, Base
from app.models.user import User
from app.models.document import Document
from app.models.chat import Chat
from app.models.message import Message

# สั่งให้สร้างตารางทั้งหมดที่ยังไม่มีใน Database โดยอัตโนมัติ
# (หมายเหตุ: ส่วน Vector ย้ายไปเก็บใน ChromaDB แล้ว ไม่ต้องสร้างตาราง document_chunks)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocumentRAG API")

# เพิ่ม CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # ต้องระบุให้ชัดเจนถึงจะอนุญาตให้ใช้ Cookie ข้ามโดเมนได้
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ผูก Router เข้าสู่ระบบ
app.include_router(auth.router)
app.include_router(document.router)
app.include_router(chat_api.router)

@app.get("/test")
def read_root():
    return {"message": "Hello World! DocumentRAG Server is running."}


