from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
import models
import schemas
import auth

# ★ 修正: jose ではなく、インストール済みの jwt (PyJWT) をインポート
import jwt
from jwt.exceptions import InvalidTokenError

Base.metadata.create_all(bind=engine)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証に失敗しました",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    # ★ 修正: JWTError ではなく InvalidTokenError をキャッチ
    except InvalidTokenError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# 1. ログインAPI (トークン発行)
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # ユーザー名で検索
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    # ユーザーが存在しない、またはパスワードが間違っている場合
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー名またはパスワードが間違っています",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # 認証成功：トークンを生成して返す
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# 2. 既存のAPIを「ログイン必須」に変更し、自分のデータだけを扱うように修正
# Depends(get_current_user) を追加することで、このAPIは保護されます

@app.get("/transactions", response_model=list[schemas.TransactionResponse])
def read_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ログイン中のユーザー(current_user)のデータのみを取得
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    return transactions

@app.post("/transactions", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 送られてきたデータに、ログイン中のユーザーIDを強制的にセットする
    db_transaction = models.Transaction(**transaction.model_dump(exclude={"user_id"}), user_id=current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/categories", response_model=list[schemas.CategoryResponse])
def read_categories(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Category).filter(models.Category.user_id == current_user.id).all()

@app.get("/payment-methods", response_model=list[schemas.PaymentMethodResponse])
def read_payment_methods(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.PaymentMethod).filter(models.PaymentMethod.user_id == current_user.id).all()