FROM ubuntu:latest

# SSH サーバーのインストールと inotify-tools のインストール
RUN apt-get update && apt-get install -y openssh-server inotify-tools curl
RUN mkdir /var/run/sshd

# inotifywaitを永続的に実行するシェルスクリプトを作成
SHELL ["/bin/bash", "-c"]
RUN echo '#!/bin/bash\n\
inotifywait -mr /var/www/html | while read -r line; do \n\
  echo "$line" | curl -X POST http://localhost:8000/broadcast-file-changed \n\
done' > /run_inotify.sh

# スクリプトに実行権限を付与
RUN chmod +x /run_inotify.sh

# コンテナの起動時にスクリプトを実行
CMD ["/bin/bash", "/run_inotify.sh"]
