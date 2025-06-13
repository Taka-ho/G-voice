import { WebSocketServer, WebSocket } from 'ws';
import {
  validateWebSocketMessage,
  getContainerIdFromRedis,
  execCommand,
  moveFile,
  getDockerFileTree,
} from './wsUtils';

export const setupWebSocketHandlers = (wss: WebSocketServer, redis: any) => {
  const clients = new Map<WebSocket, { userId: string; roomId: string }>();

  wss.on('connection', (ws: WebSocket) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => ((ws as any).isAlive = true));

    ws.on('message', async (message: string) => {
      try {
        const parsedMessage = validateWebSocketMessage(message);
        const { broadcastingRoomId, type, payload } = parsedMessage;
        const containerId = await getContainerIdFromRedis(redis, broadcastingRoomId);
        if (!containerId) throw new Error('Invalid container ID');

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

          case 'exec': {
            const { cmd } = payload;
            const result = await execCommand(containerId, cmd);
            ws.send(JSON.stringify({ status: 'success', type: 'exec_result', data: result }));
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
  });
};
