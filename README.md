# DocumentRAG

DocumentRAG คือโปรเจกต์เว็บแอปพลิเคชันที่ประยุกต์ใช้เทคโนโลยี RAG (Retrieval-Augmented Generation) เพื่อให้ผู้ใช้งานสามารถอัปโหลดเอกสารและพูดคุย (Chat) ซักถามข้อมูลจากเอกสารเหล่านั้นได้อย่างชาญฉลาด โดยมีการออกแบบส่วนต่อประสานกับผู้ใช้ (UI) ในรูปแบบ Glassmorphism ที่สวยงาม ทันสมัย พร้อมระบบจัดการประวัติการแชทที่สะดวกสบาย

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (Client)
*   **Framework:** Angular
*   **Design / UI:** Modern Glassmorphism
*   **Features:** 
    *   หน้าต่างแชทตอบโต้กับเอกสาร
    *   Sidebar สำหรับจัดการประวัติการสนทนา (เปลี่ยนชื่อ, ปักหมุด)
    *   รองรับ Responsive Design

### Backend (Server)
*   **Language:** Python 3.10+
*   **Framework:** FastAPI (รวดเร็ว, รองรับ Asynchronous)
*   **AI / RAG Framework:** LangChain / LlamaIndex
*   **Vector Database:** ChromaDB (จัดเก็บและค้นหา Vector Embeddings อย่างมีประสิทธิภาพ)
*   **LLM API:** Gemini API (ใช้ประมวลผลคำถามและสร้างคำตอบจากเอกสาร)

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์ถูกแบ่งออกเป็น 2 ส่วนหลัก:

- **`Client/`**: ส่วนของ Frontend พัฒนาด้วย Angular
- **`Server/`**: ส่วนของ Backend พัฒนาด้วย Python FastAPI

## 🛠️ การติดตั้งและการเริ่มต้นใช้งาน (Getting Started)

### การตั้งค่า Server (Backend)
1. เข้าไปที่โฟลเดอร์ `Server`
2. สร้างและเปิดใช้งาน Virtual Environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # สำหรับ Windows
