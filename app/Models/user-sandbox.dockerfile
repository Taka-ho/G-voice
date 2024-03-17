# ベースイメージの指定
FROM ubuntu:latest

# 環境変数の設定（任意）
ENV TZ=Asia/Tokyo

# パッケージのアップデートと追加
RUN apt-get update

# コンテナ内で実行するコマンドの設定（任意）
CMD ["/bin/bash"]
