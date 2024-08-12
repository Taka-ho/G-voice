# Dockerfile
FROM ubuntu:latest

# SSH サーバーのインストールと設定
RUN apt-get update && apt-get install -y openssh-server
RUN mkdir /var/run/sshd
RUN apt-get update && apt-get install -y inotify-tools

CMD "inotifywait", "-mr", "/var/www/html", "|", "while", "read", "-r", "line"; do", "echo", "\"$line\"", "|", "curl", "-X", "POST", "http://laravel-app/broadcast-file-changed"; done"
