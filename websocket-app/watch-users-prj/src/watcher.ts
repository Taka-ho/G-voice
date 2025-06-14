import { getDockerFileTree } from './wsUtils';
import { isEqual } from 'lodash';
import WebSocket from 'ws';

const roomWatchers = new Map<string, NodeJS.Timeout>(); // ← broadcastingRoomId 単位で管理

export const watchAndBroadcastDiff = async (
  redis: any,
  containerId: string,
  rootPath: string,
  roomId: string,
  ws: WebSocket
) => {
  if (roomWatchers.has(roomId)) {
    console.log(`[watch] Already watching room: ${roomId}, skipping duplicate watcher.`);
    return;
  }

  const redisKey = `g_voice_database_file_tree_cache:${roomId}`;

  const loop = async () => {
    try {
      const cachedTreeJson = await redis.get(redisKey);
      const cachedTree = cachedTreeJson ? JSON.parse(cachedTreeJson) : null;

      const currentTree = await getDockerFileTree(containerId, rootPath);

      if (!cachedTree || !isEqual(currentTree, cachedTree)) {
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
      const timer = setTimeout(loop, 1000);
      roomWatchers.set(roomId, timer);
    }
  };

  console.log(`[watch] Starting watcher for room: ${roomId}`);
  loop();
};

export const stopRoomWatchLoop = (roomId: string) => {
  const timer = roomWatchers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    roomWatchers.delete(roomId);
    console.log(`[watch] Stopped watcher for room: ${roomId}`);
  }
};
