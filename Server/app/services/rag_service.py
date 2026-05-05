import os
from sqlalchemy.orm import Session
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.core.config import settings

def process_and_embed_document(document_id: str, file_path: str, db: Session):
    """
    ฟังก์ชันสำหรับอ่านไฟล์ PDF -> หั่นข้อความ -> ฝังเวกเตอร์ด้วย Gemini -> เซฟลง PostgreSQL
    ทำงานเบื้องหลัง (Background Task)
    """
    try:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in .env")

        # 1. โหลดเอกสารด้วย PyPDFLoader
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        # 2. แบ่งข้อความ (Chunking) เพื่อให้ขนาดพอเหมาะกับ AI
        # chunk_size = 1000 ตัวอักษร, chunk_overlap = 200 (กันข้อมูลขาดตอน)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_documents(docs)
        
        # 3. เตรียม Gemini Embeddings
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", 
            google_api_key=settings.GEMINI_API_KEY
        )
        
        # 4. แปลงเวกเตอร์และบันทึกลงฐานข้อมูล (ทีละก้อน หรือทำเป็น Batch ได้)
        # หมายเหตุ: ในที่นี้เขียนแบบ Loop ธรรมดาให้เข้าใจง่าย แต่จริงๆ ถ้าไฟล์ใหญ่มากควรใช้ batching
        for chunk in chunks:
            text = chunk.page_content
            # ยิงไปที่ Gemini เพื่อขอ Vector ขนาด 768 มิติ
            vector = embeddings.embed_query(text)
            
            # ดึงเลขหน้ามาจาก Metadata (ถ้ามี)
            page_num = chunk.metadata.get("page", 0) + 1 # PyPDF นับหน้าจาก 0
            
            db_chunk = DocumentChunk(
                document_id=document_id,
                page_content=text,
                page_number=page_num,
                embedding=vector
            )
            db.add(db_chunk)
            
        # 5. เปลี่ยนสถานะเอกสารเป็น ready เมื่อทำทุกอย่างเสร็จสิ้น
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "ready"
            
        db.commit()
        print(f"Processed document {document_id} successfully.")
        
        # 6. ลบไฟล์ต้นฉบับทิ้งเพื่อประหยัดพื้นที่ Server
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted original file to save space: {file_path}")
        
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        db.rollback() # สำคัญมาก! คืนค่าการทำงานของ DB เพื่อป้องกัน Transaction ค้าง
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
