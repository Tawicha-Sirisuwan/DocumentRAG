from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import generate_answer

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("/ask", response_model=ChatResponse)
def ask_question(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    รับคำถามจากผู้ใช้ และส่งคืนคำตอบจาก AI 
    """
    if not request.document_id:
        raise HTTPException(status_code=400, detail="กรุณาระบุ document_id ที่ต้องการแชทด้วย")
        
    # 1. ให้ LLM Service ไปดึงข้อมูลและคิดคำตอบมาให้
    try:
        answer, sources = generate_answer(request.message, request.document_id, db)
    except Exception as e:
        print(f"Chat API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดจาก AI: {str(e)}")
    
    # หมายเหตุ: ในอนาคตเราสามารถเขียนโค้ดเพิ่มตรงนี้เพื่อ Save ประวัติแชทลง Table `chats` และ `messages` ได้
    # (ตอนนี้เราแค่ส่งคำตอบกลับให้ Angular โชว์บนจอก่อน)
    
    return {"answer": answer, "sources": sources}
