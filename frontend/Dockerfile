FROM node:20-alpine

WORKDIR /app

# 依存パッケージのインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピー（docker-composeのvolumesで上書きされますが、イメージ単体で動かす時のために記述）
COPY . .

# Viteの開発サーバーを起動
# Nginxコンテナ経由でアクセスするため、--host を付与して外部からのアクセスを許可します
CMD ["npm", "run", "dev", "--", "--host"]