from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
import models
import schemas

# データベースのテーブルを作成（既に存在する場合は何もしない）
Base.metadata.create_all(bind=engine)

app = FastAPI()

# データベースセッションを取得・管理するための関数（依存性注入）
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "FastAPI is running behind Nginx!"}

# --- ここから追加 ---

# 取引履歴を全件取得するAPI
@app.get("/transactions", response_model=list[schemas.TransactionResponse])
def read_transactions(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    return transactions

# カテゴリを全件取得するAPI
@app.get("/categories", response_model=list[schemas.CategoryResponse])
def read_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    return categories

# 支払い方法を全件取得するAPI
@app.get("/payment-methods", response_model=list[schemas.PaymentMethodResponse])
def read_payment_methods(db: Session = Depends(get_db)):
    payment_methods = db.query(models.PaymentMethod).all()
    return payment_methods

# 取引履歴を新規登録するAPI (POSTメソッド)
@app.post("/transactions", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    # Pydanticモデル(TransactionCreate)のデータを、SQLAlchemyモデル(models.Transaction)に変換
    db_transaction = models.Transaction(**transaction.model_dump())
    
    # データベースに追加して保存
    db.add(db_transaction)
    db.commit()
    
    # 保存したデータ（自動採番されたIDなど）を再取得して返す
    db.refresh(db_transaction)
    return db_transaction