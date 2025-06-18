# ベースイメージ
FROM node:latest

# 作業ディレクトリを設定
WORKDIR /app

# 依存ファイルを先にコピーしてキャッシュ活用
COPY package*.json ./

# 依存関係を一括インストール
RUN npm install && \
    npm install -g ts-node nodemon && \
    npm install axios chokidar ioredis ws && \
    npm install --save-dev @types/ws && \
    npm install uuid && \
    npm install --save-dev @types/uuid && \
    npm install lodash && \
    npm install --save-dev @types/lodash


# アプリケーションファイルをすべてコピー
COPY . .

# ポートを公開
EXPOSE 8080
EXPOSE 3000
EXPOSE 6379

# 開発用コマンドで起動
CMD ["npm", "run", "dev"]
