FROM ubuntu:latest

# パッケージをインストールし、apt-getプロセスが完了するまで待つ
RUN ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
RUN apt-get update && \
    apt-get install -y nodejs npm iptables php && \
    apt-get install -y ruby && \
    apt-get install -y default-jre && \
    apt-get install -y python3 && \
    npm install -g typescript ts-node

CMD ["bash"]
