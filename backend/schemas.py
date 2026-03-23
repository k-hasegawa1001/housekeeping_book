from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

# 取引履歴（トランザクション）を返すためのスキーマ
class TransactionResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    payment_method_id: int
    amount: int
    date: date
    note: Optional[str] = None

    # SQLAlchemyのモデルからデータを読み込めるようにする設定（Pydantic v2の記法）
    model_config = ConfigDict(from_attributes=True)

# カテゴリを返すためのスキーマ
class CategoryResponse(BaseModel):
    id: int
    user_id: int
    name: str
    type: str

    model_config = ConfigDict(from_attributes=True)

# 支払い方法を返すためのスキーマ
class PaymentMethodResponse(BaseModel):
    id: int
    user_id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

# 新規登録時に受け取るデータのスキーマ
# （IDはデータベースが自動で割り当てるため、ここには含めません）
class TransactionCreate(BaseModel):
    # 今回はログイン機能がないため、一旦テストユーザー(ID: 1)で固定します
    user_id: int = 1
    category_id: int
    payment_method_id: int
    amount: int
    date: date
    note: Optional[str] = None