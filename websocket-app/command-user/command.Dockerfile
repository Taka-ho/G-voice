# 公式Nodeイメージを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# 依存ファイルをコピー
COPY package*.json ./

# 依存パッケージインストール
RUN npm install && \
    npm install -g ts-node nodemon && \
    npm install axios chokidar ioredis ws && \
    npm install --save-dev @types/ws
# ソースコード等をコピー
COPY . .

# ポート開放
EXPOSE 3000

# 開発用（nodemon & ts-nodeでホットリロード）
CMD ["npx", "nodemon", "--watch", "src", "--exec", "ts-node", "src/index.ts"]
