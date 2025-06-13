import { getDockerFileTree } from './wsUtils'; // 上記コード
import { isEqual } from 'lodash'; // 差分比較用
import WebSocket from 'ws';

export const watchAndBroadcastDiff = async (
  redis: any,
  containerId: string,
  rootPath: string,
  roomId: string,
  ws: WebSocket
) => {
  const redisKey = `g_voice_database_file_tree_cache:${roomId}`;

  const loop = async () => {
    try {
      const currentTree = await getDockerFileTree(containerId, rootPath);

      const cachedTreeJson = await redis.get(redisKey);
      const cachedTree = cachedTreeJson ? JSON.parse(cachedTreeJson) : null;

      if (!isEqual(currentTree, cachedTree)) {
        // 差分がある場合のみ送信
        ws.send(JSON.stringify({
          type: 'fileTreeUpdate',
          data: currentTree,
          broadcastingRoomId: roomId,
        }));

        await redis.set(redisKey, JSON.stringify(currentTree));
      }
    } catch (error: any) {
      console.error(`watchAndBroadcastDiff failed for room ${roomId}:`, error.message);
    } finally {
      setTimeout(loop, 1000); // 1秒後に再実行
    }
  };

  loop();
};
