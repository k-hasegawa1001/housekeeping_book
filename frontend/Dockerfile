FROM node:20-alpine

WORKDIR /app

# パッケージ情報があれば先にインストール
COPY package*.json ./
RUN if [ -f package.json ]; then npm install; fi

# Viteの開発サーバーを起動（Docker外からアクセスするため --host を付与）
CMD ["npm", "run", "dev", "--", "--host"]