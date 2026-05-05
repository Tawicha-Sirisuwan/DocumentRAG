import requests
import chromadb
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.core.config import settings

# ใช้ ChromaDB Client ตัวเดียวกับ rag_service
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

def generate_answer(query: str, document_id: str, db: Session):
    """
    1. เปลี่ยนคำถามเป็น Vector
    2. ดึงข้อมูลที่เกี่ยวข้องจาก ChromaDB
    3. ส่งข้อมูลให้ Gemini ช่วยสรุปเป็นคำตอบ
    """
    # 1. สร้าง Vector ของคำถามด้วย REST API
    query_vector = get_gemini_embedding(query)

    # 2. ค้นหาเอกสารที่เกี่ยวข้องจาก ChromaDB (Top-5)
    try:
        collection = chroma_client.get_collection(name=f"doc_{document_id}")
    except Exception:
        return "ขออภัยครับ ไม่พบเอกสารนี้ในระบบ กรุณาอัปโหลดไฟล์ PDF ก่อนครับ", []
    
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=5
    )
    
    if not results["documents"] or not results["documents"][0]:
        return "ขออภัยครับ ไม่พบข้อมูลที่เกี่ยวข้องในเอกสารนี้", []
        
    # นำเนื้อหาที่ค้นพบมาต่อกันเป็น "บริบท (Context)" ให้ AI
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    
    context_text = "\n\n".join([
        f"ข้อมูลหน้า {m.get('page', '?')}:\n{doc}" 
        for doc, m in zip(documents, metadatas)
    ])
    
    # 3. เตรียมสั่งงาน LLM (Gemini) ด้วย REST API โดยตรง
    prompt_text = (
        f"คุณคือผู้ช่วย AI อัจฉริยะ จงตอบคำถามโดยอ้างอิงจากข้อมูลด้านล่างนี้เท่านั้น\n"
        f"ถ้าข้อมูลไม่เพียงพอให้ตอบว่า 'ไม่มีข้อมูลในเอกสาร'\n\n"
        f"ข้อมูลอ้างอิง:\n{context_text}\n\n"
        f"คำถามของผู้ใช้: {query}\n\n"
        f"คำตอบ (สรุปให้เข้าใจง่ายและเป็นมืออาชีพ):"
    )
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {"temperature": 0.3}
    }
    
    import requests
    resp = requests.post(url, json=payload)
    
    if resp.status_code == 200:
        try:
            answer_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            sources = [{"page": m.get("page", "?"), "content": doc[:100] + "..."} for doc, m in zip(documents, metadatas)]
            return answer_text, sources
        except Exception:
            return "ได้รับคำตอบจาก AI แต่รูปแบบข้อมูลผิดพลาด", []
    else:
        # ถ้ามี Error โควต้า ให้แสดงข้อความแจ้งเตือนจาก Google
        error_msg = resp.json().get("error", {}).get("message", resp.text)
        
        # แอบไปดึงรายชื่อโมเดลที่ใช้งานได้จริงๆ มาโชว์ให้ผู้ใช้เห็น
        try:
            list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={settings.GEMINI_API_KEY}"
            list_resp = requests.get(list_url)
            if list_resp.status_code == 200:
                models = [m['name'].replace('models/', '') for m in list_resp.json().get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
                return f"⚠️ ข้อผิดพลาด: {error_msg}\n\n👉 **คุณสามารถนำชื่อโมเดลด้านล่างนี้ไปเปลี่ยนในไฟล์ `llm_service.py` บรรทัดที่ 65 ได้เลยครับ:**\n{', '.join(models)}", []
        except Exception:
            pass

        return f"⚠️ เกิดข้อผิดพลาดจาก Google API: {error_msg}", []
