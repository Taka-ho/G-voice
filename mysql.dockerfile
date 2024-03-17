# ベースイメージの指定
FROM mysql/mysql-server:8.0

# ポートの公開
EXPOSE 3306

# 環境変数の設定
ENV MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
ENV MYSQL_ROOT_HOST=%
ENV MYSQL_DATABASE=${DB_DATABASE}
ENV MYSQL_USER=${DB_USERNAME}
ENV MYSQL_PASSWORD=${DB_PASSWORD}
ENV MYSQL_ALLOW_EMPTY_PASSWORD=1

# ボリュームの指定
VOLUME /var/lib/mysql

# 健康チェックの設定
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD ["mysqladmin", "ping", "-p${DB_PASSWORD}"]
