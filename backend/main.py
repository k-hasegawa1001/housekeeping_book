from fastapi import FastAPI
from database import engine, Base
import models

# データベースのテーブルを作成（既に存在する場合は何もしない）
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI is running behind Nginx!"}

@app.get("/test")
def test_endpoint():
    return {"message": "This is a test endpoint."}