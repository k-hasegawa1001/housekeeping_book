import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# docker-compose.yml で設定した環境変数を取得（デフォルト値も設定）
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://user:password@db:3306/housekeeping_book"
)

# データベースエンジンを作成
engine = create_engine(DATABASE_URL)

# データベースセッションを作成するクラス
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 各モデル（テーブル設計図）のベースとなるクラス
Base = declarative_base()