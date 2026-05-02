@echo off
echo ==========================================
echo Starting DocumentRAG Backend Server...
echo ==========================================

REM เรียกใช้งาน Virtual Environment
call .\venv\Scripts\activate.bat

REM รัน FastAPI Server ด้วย Uvicorn พร้อมเปิดโหมด Reload (อัปเดตอัตโนมัติเมื่อแก้โค้ด)
uvicorn app.main:app --reload
