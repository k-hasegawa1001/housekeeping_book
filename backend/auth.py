from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt

# トークン生成用の秘密鍵（本来は環境変数などに隠すべきですが、今回は直書きします）
SECRET_KEY = "your-super-secret-key-for-housekeeping-app"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # トークンの有効期限（60分）

# パスワードハッシュ化のための設定
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. パスワードが正しいか検証する関数
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 2. パスワードをハッシュ化する関数
def get_password_hash(password):
    return pwd_context.hash(password)

# 3. JWT（アクセストークン）を生成する関数
def create_access_token(data: dict):
    to_encode = data.copy()
    # 現在時刻から60分後の有効期限を設定
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # ペイロード（データ）と秘密鍵を使ってトークンをエンコード（作成）
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt