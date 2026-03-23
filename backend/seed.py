# backend/seed.py
from datetime import date
from database import SessionLocal
import models

def seed_data():
    db = SessionLocal()

    try:
        # 既にデータが入っている場合は二重登録を防ぐためにスキップ
        if db.query(models.User).first():
            print("既にデータが存在するため、シード処理をスキップします。")
            return

        print("シードデータの投入を開始します...")

        # 1. テストユーザーの作成
        # (パスワードは本来ハッシュ化しますが、今回はテスト用なのでダミー文字列です)
        test_user = models.User(
            username="test_user",
            email="test@example.com",
            hashed_password="dummy_password"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user) # IDを取得するためにリフレッシュ

        # 2. カテゴリの作成
        categories = [
            models.Category(user_id=test_user.id, name="食費", type="expense"),
            models.Category(user_id=test_user.id, name="日用品", type="expense"),
            models.Category(user_id=test_user.id, name="給料", type="income"),
        ]
        db.add_all(categories)

        # 3. 支払い方法の作成
        payment_methods = [
            models.PaymentMethod(user_id=test_user.id, name="現金"),
            models.PaymentMethod(user_id=test_user.id, name="クレジットカード"),
        ]
        db.add_all(payment_methods)

        db.commit() # 一度コミットしてカテゴリと支払い方法のIDを確定させる

        # 先ほど追加したカテゴリと支払い方法をDBから再取得してIDを使えるようにする
        food_category = db.query(models.Category).filter_by(name="食費").first()
        salary_category = db.query(models.Category).filter_by(name="給料").first()
        cash_method = db.query(models.PaymentMethod).filter_by(name="現金").first()
        card_method = db.query(models.PaymentMethod).filter_by(name="クレジットカード").first()

        # 4. トランザクション（取引履歴）の作成
        transactions = [
            models.Transaction(
                user_id=test_user.id,
                category_id=salary_category.id,
                payment_method_id=cash_method.id,
                amount=250000,
                date=date(2026, 3, 20),
                note="3月分給与"
            ),
            models.Transaction(
                user_id=test_user.id,
                category_id=food_category.id,
                payment_method_id=card_method.id,
                amount=1200,
                date=date(2026, 3, 21),
                note="スーパーで食材購入"
            )
        ]
        db.add_all(transactions)
        db.commit()

        print("シードデータの投入が完了しました！")

    except Exception as e:
        print(f"エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()