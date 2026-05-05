from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth
from app.api import document
from app.api import chat_api

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


