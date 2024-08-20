FROM ubuntu:latest

# 必要なツールをインストール
RUN apt-get update && apt-get install -y openssh-server inotify-tools curl netcat

# SSHサーバーの設定
RUN mkdir /var/run/sshd

# inotifywaitを永続的に実行するシェルスクリプトを作成
RUN echo '#!/bin/bash\n\
while inotifywait -r -e modify,create,delete /root; do \n\
  for file in $(find /root -type f); do \n\
    content=$(cat "$file"); \n\
    event_type="modify"; \n\
    echo "{\"type\": \"$event_type\", \"filename\": \"$file\", \"content\": \"$content\"}" | nc -q 0 localhost 8080; \n\
  done \n\
done' > /run_inotify.sh

# スクリプトに実行権限を付与
RUN chmod +x /run_inotify.sh

# ワーキングディレクトリの設定
WORKDIR /root

# コンテナの起動時にスクリプトを実行
CMD ["/bin/bash", "/run_inotify.sh"]
