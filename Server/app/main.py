from fastapi import FastAPI

app = FastAPI(title="DocumentRAG API")

@app.get("/test")
def read_root():
    return {"message": "Hello World! DocumentRAG Server is running."}


