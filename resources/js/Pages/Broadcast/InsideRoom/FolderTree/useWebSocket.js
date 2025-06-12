import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export default function useWebSocket(onMessage) {
  const ws = useRef(null);
  const { broadcastingRoomId } = useParams(); // ルーティングから取得

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      // WebSocketが開いたときにbroadcastingRoomIdを送信
      if (broadcastingRoomId) {
        ws.current.send(JSON.stringify({
          type: 'JOIN_ROOM',
          broadcastingRoomId,
        }));
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };

    return () => {
      ws.current?.close();
    };
  }, [onMessage, broadcastingRoomId]);

  return ws;
}
