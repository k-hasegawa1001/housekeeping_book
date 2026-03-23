from datetime import date
from database import SessionLocal
import models
import auth

def seed_data():
    db = SessionLocal()

    try:
        # 1. 既にユーザーが存在するか確認
        test_user = db.query(models.User).filter_by(username="test_user").first()

        # 既にユーザーが存在する場合は、パスワードだけハッシュ化して終了（既にカテゴリ等もあるため）
        if test_user:
            print("既存のユーザーのパスワードをハッシュ化して更新します...")
            test_user.hashed_password = auth.get_password_hash("password123")
            db.commit()
            print("パスワードの更新が完了しました！")
            return

        # ユーザーが存在しない場合（まっさらなDBの場合）は、全データを構築
        print("シードデータの投入を開始します...")

        # 2. テストユーザーの作成（ハッシュ化パスワード）
        hashed_pw = auth.get_password_hash("password123")
        new_user = models.User(
            username="test_user",
            email="test@example.com",
            hashed_password=hashed_pw
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 3. カテゴリの作成
        categories = [
            models.Category(user_id=new_user.id, name="食費", type="expense"),
            models.Category(user_id=new_user.id, name="日用品", type="expense"),
            models.Category(user_id=new_user.id, name="給料", type="income"),
        ]
        db.add_all(categories)

        # 4. 支払い方法の作成
        payment_methods = [
            models.PaymentMethod(user_id=new_user.id, name="現金"),
            models.PaymentMethod(user_id=new_user.id, name="クレジットカード"),
        ]
        db.add_all(payment_methods)

        db.commit() # 一度コミットしてIDを確定

        # 再取得してIDを使えるようにする
        food_category = db.query(models.Category).filter_by(name="食費").first()
        salary_category = db.query(models.Category).filter_by(name="給料").first()
        cash_method = db.query(models.PaymentMethod).filter_by(name="現金").first()
        card_method = db.query(models.PaymentMethod).filter_by(name="クレジットカード").first()

        # 5. トランザクション（取引履歴）の作成
        transactions = [
            models.Transaction(
                user_id=new_user.id,
                category_id=salary_category.id,
                payment_method_id=cash_method.id,
                amount=250000,
                date=date(2026, 3, 20),
                note="3月分給与"
            ),
            models.Transaction(
                user_id=new_user.id,
                category_id=food_category.id,
                payment_method_id=card_method.id,
                amount=1200,
                date=date(2026, 3, 21),
                note="スーパーで食材購入"
            )
        ]
        db.add_all(transactions)
        db.commit()

        print("シードデータの新規投入が完了しました！")

    except Exception as e:
        print(f"エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()