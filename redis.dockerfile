# ベースイメージの指定
FROM redis:alpine

# ポートの公開
EXPOSE 6379

# 健康チェックの設定
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD ["healthcheck.sh"]

# ボリュームの指定
VOLUME /data

# コンテナ実行時のエントリーポイント
CMD ["redis-server"]
