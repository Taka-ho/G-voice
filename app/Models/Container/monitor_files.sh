#!/bin/bash

# 監視対象のディレクトリ
WATCH_DIR="$HOME"

# 変更を検知したら、JSON形式で出力する
inotifywait -mr --format '{"path":"%w","file":"%f","event":"%e"}' "$WATCH_DIR" | while read file; do
    echo "$file"
done
