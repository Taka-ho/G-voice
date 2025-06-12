import { WebSocketServer, WebSocket } from 'ws';
import { validateWebSocketMessage, authenticateUser, checkRoomOwnership, getContainerIdFromRedis, execCommand, moveFile, getDockerFileTree } from './wsUtils';

export const setupWebSocketHandlers = (wss: WebSocketServer, redis: any) => {
  const clients = new Map<WebSocket, { userId: string; roomId: string }>();

  wss.on('connection', (ws: WebSocket) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => ((ws as any).isAlive = true));

    ws.on('message', async (message: string) => {
      try {
        const parsedMessage = validateWebSocketMessage(message);
        const { broadcastingRoomId, token, type, payload } = parsedMessage;

        const userId = await authenticateUser(token);
        clients.set(ws, { userId, roomId: broadcastingRoomId });

        await checkRoomOwnership(userId, broadcastingRoomId);

        const containerId = await getContainerIdFromRedis(redis, broadcastingRoomId);
        if (!containerId) throw new Error('Invalid container ID');

        // TODO: Handle WebSocket message types and payloads

      } catch (err: any) {
        console.error('WebSocket error:', err.message);
        ws.send(JSON.stringify({ status: 'error', message: err.message }));
        ws.close();
      }
    });
  });
};
