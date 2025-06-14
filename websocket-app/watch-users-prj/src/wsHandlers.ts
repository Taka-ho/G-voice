import { WebSocketServer, WebSocket } from 'ws';
import { stopRoomWatchLoop } from './watcher';
import {
  validateWebSocketMessage,
  getContainerIdFromRedis,
  execCommand,
  moveFile,
  getDockerFileTree,
} from './wsUtils';
import { watchAndBroadcastDiff } from './watcher';

export const setupWebSocketHandlers = (wss: WebSocketServer, redis: any) => {
  const clients = new Map<WebSocket, { userId: string; roomId: string }>();

  wss.on('connection', (ws: WebSocket) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => ((ws as any).isAlive = true));

    ws.on('message', async (message: string) => {
      try {
        const parsedMessage = validateWebSocketMessage(message);
        const { broadcastingRoomId, type, payload } = parsedMessage;
        clients.set(ws, { userId: '', roomId: broadcastingRoomId });
        const containerId = await getContainerIdFromRedis(redis, broadcastingRoomId);
        if (!containerId) throw new Error('Invalid container ID');
        console.log(type);
        switch (type) {
          case 'rename': {
            const { oldPath, newPath } = payload;
            await moveFile(containerId, oldPath, newPath);
            ws.send(JSON.stringify({ status: 'success', type: 'rename' }));
            break;
          }

          case 'get_file_tree': {
            const fileTree = await getDockerFileTree(containerId, '/root');
            ws.send(JSON.stringify({ status: 'success', type: 'file_tree', data: fileTree }));
            break;
          }

          case 'watch_file_tree': {
            watchAndBroadcastDiff(redis, containerId, '/root', broadcastingRoomId, ws);
            ws.send(JSON.stringify({ status: 'success', type: 'watch_started' }));
            break;
          }

          case 'exec': {
            const { cmd } = payload;
            const result = await execCommand(containerId, cmd);
            ws.send(JSON.stringify({ status: 'success', type: 'exec_result', data: result }));
            break;
          }

          case 'update_file_content': {
            const { file } = payload;
            const { path, content } = file;

            if (!path || content == null) {
              throw new Error('Invalid file payload');
            }

            // ファイルの内容を更新
            const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const command = `echo "${escapedContent}" > "${path}"`;
            await execCommand(containerId, ['sh', '-c', command]);

            ws.send(JSON.stringify({ status: 'success', type: 'update_file_content', path }));
            break;
          }

          default:
            throw new Error(`Unknown message type: ${type}`);
        }
      } catch (err: any) {
        console.error('[WebSocket error]:', err.message);
        ws.send(JSON.stringify({ status: 'error', message: err.message }));
        ws.close();
      }
    });

    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      if (clientInfo?.roomId) {
        stopRoomWatchLoop(clientInfo.roomId);
      }
      clients.delete(ws);
    });
  });
};
