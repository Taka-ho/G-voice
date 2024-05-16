FROM ubuntu:latest

# 必要なパッケージのインストール
RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
RUN apt-get update && \
    apt-get install -y nodejs npm iptables php && \
    apt-get install -y ruby && \
    apt-get install -y default-jre && \
    apt-get install -y python3 && \
    npm install -g typescript ts-node \
    apt-get install curl

# Expressの環境構築
RUN npm install -g express-generator

# アプリケーションのディレクトリを作成
RUN mkdir /app

# ソースコードをコピー
COPY . /app
WORKDIR /app

# アプリケーションの依存関係をインストール
RUN npm install

# ポートの公開
EXPOSE 3030

# サーバーの起動
ENTRYPOINT ["npm", "start"]
