import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.document import Document
from app.models.user import User
from app.api.deps import get_current_active_user
from app.services.rag_service import process_and_embed_document

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True) # สร้างโฟลเดอร์เก็บไฟล์อัตโนมัติถ้ายังไม่มี

@router.post("/upload")
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    อัปโหลดไฟล์ PDF เพื่อนำไปทำ RAG
    กระบวนการ Extract ข้อความจะถูกโยนไปทำเบื้องหลัง (Background Task)
    เพื่อให้ API ตอบสนองได้ทันที (User ไม่ต้องรอนาน)
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="ระบบรองรับเฉพาะไฟล์ PDF ในขณะนี้")
        
    # ป้องกันไฟล์ชื่อซ้ำกันโดยเอา User ID นำหน้า
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    
    # เซฟไฟล์ต้นฉบับลงโฟลเดอร์ของ Server
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # สร้างข้อมูลลง Database ด้วยสถานะ 'processing'
    new_doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        status="processing"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # โยนงานหนัก (Vector Embedding) ไปให้ Background Worker ทำต่อ
    background_tasks.add_task(process_and_embed_document, new_doc.id, file_path, db)
    
    return {
        "message": "อัปโหลดสำเร็จ! เอกสารกำลังถูกประมวลผล", 
        "document_id": new_doc.id,
        "status": "processing"
    }
