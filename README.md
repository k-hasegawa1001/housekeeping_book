# 家計簿アプリ (Housekeeping Book App)

React + FastAPI + MySQL を使用し、Docker環境で構築されたモダンな家計簿アプリケーションです。

## 使用技術

- **Frontend:** React, Vite
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** MySQL 8.0
- **Infrastructure:** Docker, Docker Compose, Nginx (リバースプロキシ)

## 環境構築と起動手順

ローカル環境（またはEC2インスタンス）でアプリを動かすための手順です。
前提条件として、Git と Docker / Docker Compose がインストールされている必要があります。

### 1. リポジトリのクローン

```bash
git clone <あなたのリポジトリURL>
cd housekeeping_book
```

### 2. コンテナのビルドと起動

Dockerを使ってフロントエンド、バックエンド、データベース、Nginxの各コンテナを一括で起動します。

```bash
docker-compose up -d --build
```

### 4. アプリケーションへのアクセス

ブラウザを開き、以下のURLにアクセスしてください。

- ローカル環境: `http://localhost`
- EC2などのリモート環境: `http://<割り当てられたドメインまたはIP>`

---

## 開発において工夫した点

- **ホットリロードの完全対応 (DXの向上)**
  Docker環境下でも快適に開発できるよう、ViteとFastAPIのホットリロードを有効化しています。フロントエンド側はNginxの設定でWebSocket通信をプロキシさせることで、コードの変更を即座にブラウザに反映させています（`CHOKIDAR_USEPOLLING=true` を活用）。
- **不要なI/O処理（DBアクセス）の削減**
  アプリケーションのパフォーマンスを最適化するため、初回ロード時やデータ更新時のみAPI経由でDBからデータを取得する設計（SPA）にしています。一覧の「並べ替え」や「カテゴリによる絞り込み」については、サーバーへリクエストを飛ばさず、Reactのステート（クライアント側）のみで処理を完結させることで、DBへの負荷を極力減らし、サクサク動くUIを実現しました。
- **NginxによるCORS問題の回避とルーティング**
  フロントエンドとバックエンドの間にNginxを配置し、`/api/` へのアクセスをFastAPIへ、それ以外をReactへと振り分けることで、面倒なCORS設定を回避しつつ本番環境に近い構成を取っています。

---

## 開発中に苦労した点・乗り越えたエラー（Geminiとのペアプログラミング記録）

開発中、環境構築周りでいくつか特有のエラーに直面しましたが、AIアシスタント（Gemini）と壁打ちをしながら以下の手順で解決しました。

1. **Dockerのビルドキャッシュと `node_modules` の競合**
   - **症状:** `invalid file request node_modules/.bin/acorn` というエラーでフロントエンドのビルドが失敗。
   - **解決策:** Windows環境のショートカット等を含む重いフォルダがビルドコンテキストに送られないよう、`.dockerignore` ファイルを作成して `node_modules` と `dist` を除外しました。
2. **MySQL 8.0 の認証エラー**
   - **症状:** FastAPIからDB接続時に `RuntimeError: 'cryptography' package is required for sha256_password...` が発生。
   - **解決策:** MySQL 8.0の強固なパスワード認証（`caching_sha2_password`）をPyMySQLで突破するため、`requirements.txt` に `cryptography` パッケージを追加してコンテナを再ビルドしました。
3. **AWSデプロイ時のViteによるホスト名ブロック**
   - **症状:** EC2にデプロイ後、DuckDNSのドメインでアクセスすると `Blocked request. This host is not allowed.` となり画面が表示されない。
   - **解決策:** Viteの開発サーバー（ローカル用途前提）のセキュリティ機能が働いていたため、`vite.config.js` に `server.allowedHosts` の設定を追加し、外部ドメインからのアクセスを明示的に許可しました。
