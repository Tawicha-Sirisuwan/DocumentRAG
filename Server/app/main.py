from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth

app = FastAPI(title="DocumentRAG API")

# เพิ่ม CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # ต้องระบุให้ชัดเจนถึงจะอนุญาตให้ใช้ Cookie ข้ามโดเมนได้
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ผูก Auth Router เข้าสู่ระบบ
app.include_router(auth.router)

@app.get("/test")
def read_root():
    return {"message": "Hello World! DocumentRAG Server is running."}


