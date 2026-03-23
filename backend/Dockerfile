FROM python:3.11-slim

WORKDIR /app

# 依存パッケージのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 開発用サーバーの起動（コード変更時に自動リロードする設定）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]