from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.prompts import PromptTemplate
from app.models.document_chunk import DocumentChunk
from app.core.config import settings

def generate_answer(query: str, document_id: str, db: Session):
    """
    1. เปลี่ยนคำถามเป็น Vector
    2. ดึงข้อมูลที่เกี่ยวข้องจาก Database
    3. ส่งข้อมูลให้ Gemini ช่วยสรุปเป็นคำตอบ
    """
    # 1. สร้าง Vector ของคำถาม
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004", 
        google_api_key=settings.GEMINI_API_KEY
    )
    query_vector = embeddings.embed_query(query)

    # 2. ค้นหาเอกสารที่เกี่ยวข้องด้วย Cosine Similarity (หาตัวที่ใกล้เคียงคำถามที่สุด 5 อันดับแรก)
    results = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id)\
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))\
        .limit(5).all()
        
    if not results:
        return "ขออภัยครับ ไม่พบข้อมูลที่เกี่ยวข้องในเอกสารนี้", []
        
    # นำเนื้อหาที่ค้นพบมาต่อกันให้เป็นข้อความยาวๆ เพื่อส่งเป็น "บริบท (Context)" ให้ AI
    context_text = "\n\n".join([f"ข้อมูลหน้า {r.page_number}:\n{r.page_content}" for r in results])
    
    # 3. เตรียมสั่งงาน LLM (Gemini)
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash", # โมเดลเร็วและฉลาด (เปลี่ยนเป็น pro ได้ถ้าต้องการความลึกซึ้ง)
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.3 # ค่าความแม่นยำ ยิ่งต่ำ AI ยิ่งตอบเป๊ะตามบริบท (ไม่มั่ว)
    )
    
    # สร้าง Prompt บังคับให้ AI ตอบเฉพาะจากข้อมูลที่ให้ไป
    prompt = PromptTemplate.from_template(
        "คุณคือผู้ช่วย AI อัจฉริยะ จงตอบคำถามโดยอ้างอิงจากข้อมูลด้านล่างนี้เท่านั้น\n"
        "ถ้าข้อมูลไม่เพียงพอให้ตอบว่า 'ไม่มีข้อมูลในเอกสาร'\n\n"
        "ข้อมูลอ้างอิง:\n{context}\n\n"
        "คำถามของผู้ใช้: {question}\n\n"
        "คำตอบ (สรุปให้เข้าใจง่ายและเป็นมืออาชีพ):"
    )
    
    # รวม Prompt และ LLM เข้าด้วยกันแล้วสั่งรัน (Invoke)
    chain = prompt | llm
    answer = chain.invoke({"context": context_text, "question": query})
    
    # 4. ส่งกลับคำตอบพร้อมแหล่งอ้างอิง (เพื่อนำไปโชว์ใน Frontend ว่ามาจากหน้าไหน)
    sources = [{"page": r.page_number, "content": r.page_content[:100] + "..."} for r in results]
    return answer.content, sources
