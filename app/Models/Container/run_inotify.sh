#!/bin/bash

# /var/www/html ディレクトリを監視し、変更があればエンドポイントに通知
inotifywait -mr /var/www/html | while read -r line; do
  echo "$line" | curl -X POST http://localhost:8000/broadcast-file-changed
done
