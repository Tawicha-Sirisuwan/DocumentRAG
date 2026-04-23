# แผนการพัฒนา Backend สำหรับ DocumentRAG

ในการพัฒนา Backend สำหรับระบบ RAG (Retrieval-Augmented Generation) เราจะเน้นไปที่การใช้ **Python** เนื่องจากมีไลบรารีรองรับด้าน AI และการประมวลผลข้อความที่ดีที่สุด (เช่น LangChain, LlamaIndex)

## 1. การเลือก Tech Stack (เครื่องมือที่จะใช้)
*   **ภาษาโปรแกรม:** Python 3.10+
*   **Web Framework:** FastAPI (เร็ว, เขียนง่าย, รองรับ Asynchronous, และมี API Docs ให้ในตัว)
*   **AI / RAG Framework:** LangChain หรือ LlamaIndex
*   **Vector Database:** ChromaDB (ใช้ง่ายในเครื่อง) หรือ Qdrant / Pinecone / PostgreSQL (pgvector)
*   **LLM & Embedding:** OpenAI API (หรือ Ollama ถ้าต้องการรัน Local)

## 2. โครงสร้างโฟลเดอร์ (Folder Structure)
ควรจัดโครงสร้างโฟลเดอร์ให้เป็นระเบียบเพื่อง่ายต่อการขยายโปรเจกต์ในอนาคต:

```text
Server/
│
├── app/
│   ├── main.py              # ไฟล์หลักสำหรับรัน FastAPI และตั้งค่าต่างๆ
│   ├── api/                 # โฟลเดอร์เก็บ Routes (API Endpoints)
│   │   ├── chat.py          # API สำหรับการแชท (ถาม-ตอบ)
│   │   └── document.py      # API สำหรับอัปโหลดและจัดการเอกสาร
│   ├── core/                # การตั้งค่า (Config) เช่น ดึงค่าจาก .env
│   ├── models/              # Pydantic Models (กำหนดรูปแบบ Request/Response)
│   ├── services/            # โลจิกของแอปพลิเคชัน
│   │   ├── rag_service.py   # โลจิกการทำ Retrieval และ Generation
│   │   └── vector_db.py     # การเชื่อมต่อและจัดการ Vector Database
│   └── utils/               # ฟังก์ชันช่วยเหลือต่างๆ เช่น การจัดการไฟล์
│
├── requirements.txt         # รายชื่อไลบรารีที่ใช้
├── .env                     # ไฟล์เก็บตัวแปรสภาพแวดล้อม (API Keys, Database URLs)
└── .gitignore               # ไฟล์สำหรับซ่อนไฟล์ที่ไม่ต้องการเข้า Git
```

## 3. ขั้นตอนการเริ่มต้นพัฒนา (Step-by-Step)

### Phase 1: การตั้งค่าโปรเจกต์เริ่มต้น (Project Setup)
1. เข้าไปที่โฟลเดอร์ `Server`
2. สร้าง Virtual Environment: `python -m venv venv`
3. เปิดใช้งาน Virtual Environment (Activate)
4. ติดตั้งไลบรารีพื้นฐาน: `pip install fastapi uvicorn python-dotenv pydantic`
5. สร้างไฟล์ `app/main.py` และทำ API ทดสอบ (Hello World)

### Phase 2: ระบบจัดการเอกสาร (Document Ingestion)
1. ติดตั้งไลบรารีเพิ่มเติม: `pip install langchain chromadb tiktoken pypdf sentence-transformers` (หรือ openai)
2. สร้าง API `/api/upload` สำหรับรับไฟล์ (เช่น PDF)
3. เขียนโลจิกเพื่อ:
   *   **Load:** อ่านข้อความจากเอกสาร
   *   **Split:** หั่นข้อความเป็นส่วนเล็กๆ (Chunks)
   *   **Embed:** แปลงข้อความเป็นตัวเลข (Vector Embeddings)
   *   **Store:** บันทึกลง Vector Database

### Phase 3: ระบบถาม-ตอบ (Chat & Retrieval)
1. สร้าง API `/api/chat` สำหรับรับข้อความคำถามจากผู้ใช้
2. เขียนโลจิกเพื่อ:
   *   **Retrieve:** นำคำถามไปค้นหาข้อความที่เกี่ยวข้องที่สุดใน Vector Database
   *   **Prompt:** นำคำถาม + ข้อมูลที่ค้นเจอ มาเรียบเรียงเป็น Prompt
   *   **Generate:** ส่ง Prompt ให้ LLM (เช่น GPT-4o) เพื่อสร้างคำตอบ
3. (ทางเลือก) ทำให้ API ส่งคำตอบกลับมาแบบ Streaming (พิมพ์ตอบทีละคำ) เหมือน ChatGPT

### Phase 4: การเชื่อมต่อกับ Frontend
*   ตั้งค่า CORS (Cross-Origin Resource Sharing) ใน FastAPI เพื่อให้ Angular (Client) สามารถยิง API มาหา Backend ได้
*   ทดสอบเชื่อมต่อ API จากหน้าเว็บ Angular ที่ทำไว้

---
**พร้อมที่จะเริ่ม Phase 1 แล้วหรือยัง?** ถ้าพร้อมแล้ว เรามาเริ่มตั้งค่าโปรเจกต์และรันเซิร์ฟเวอร์แรกด้วย FastAPI กันเลย!
