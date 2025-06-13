import { useEffect, useRef } from 'react';
import { useAppData } from '../../Contexts/AppDataContext';

export default function useWebSocket(onMessage) {
  const ws = useRef(null);
  const { broadcastingRoomId } = useAppData();
  useEffect(() => {
    if (!broadcastingRoomId) return;
    
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        type: 'get_file_tree',
        broadcastingRoomId,
      }));
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
