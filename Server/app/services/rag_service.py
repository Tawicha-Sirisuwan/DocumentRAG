import os
import requests
import chromadb
from sqlalchemy.orm import Session
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.models.document import Document
from app.core.config import settings

# สร้าง ChromaDB Client แบบ Persistent (เก็บข้อมูลลงโฟลเดอร์ในเครื่อง ปิดเปิดก็ไม่หาย)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def get_gemini_embedding(text: str) -> list[float]:
    """เรียกใช้ Gemini Embedding ผ่าน HTTP REST API"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "model": "models/gemini-embedding-2",
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": 768
    }
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise Exception(f"Gemini API Error: {response.text}")
    return response.json()["embedding"]["values"]

def process_and_embed_document(document_id: str, file_path: str, db: Session):
    """
    ฟังก์ชันสำหรับอ่านไฟล์ PDF -> หั่นข้อความ -> ฝังเวกเตอร์ด้วย Gemini -> เซฟลง ChromaDB
    ทำงานเบื้องหลัง (Background Task)
    """
    try:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in .env")

        # 1. โหลดเอกสารด้วย PyPDFLoader
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        # 2. แบ่งข้อความ (Chunking) เพื่อให้ขนาดพอเหมาะกับ AI
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_documents(docs)
        
        # 3. สร้าง Collection ใน ChromaDB (1 เอกสาร = 1 Collection)
        collection = chroma_client.get_or_create_collection(name=f"doc_{document_id}")
        
        # 4. แปลงเวกเตอร์และบันทึกลง ChromaDB ทีละก้อน
        for i, chunk in enumerate(chunks):
            text = chunk.page_content
            vector = get_gemini_embedding(text)
            page_num = chunk.metadata.get("page", 0) + 1
            
            collection.add(
                ids=[f"chunk_{i}"],
                documents=[text],
                embeddings=[vector],
                metadatas=[{"page": page_num, "document_id": document_id}]
            )
            
        # 5. เปลี่ยนสถานะเอกสารเป็น ready เมื่อทำทุกอย่างเสร็จสิ้น
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "ready"
            
        db.commit()
        print(f"Processed document {document_id} successfully. ({len(chunks)} chunks)")
        
        # 6. ลบไฟล์ต้นฉบับทิ้งเพื่อประหยัดพื้นที่ Server
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted original file: {file_path}")
        
    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        db.rollback()
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "failed"
            db.commit()
