import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../../Contexts/AppDataContext';

export default function useWebSocket(onMessage) {
  const ws = useRef(null);
  const isReady = useRef(false);
  const [readyToSend, setReadyToSend] = useState(false);
  const hasSentInitialRequest = useRef(false);
  const previousFileContents = useRef({});
  const initialFileContents = useRef(null); // 初期ロード用のキャッシュ
  const { broadcastingRoomId, treeData, fileContents } = useAppData();

  useEffect(() => {
    if (!broadcastingRoomId) return;

    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      isReady.current = true;
      setReadyToSend(true);

      if (!hasSentInitialRequest.current) {
        const shouldWatch = treeData && (!fileContents || Object.keys(fileContents).length === 0);

        if (shouldWatch) {
          ws.current.send(JSON.stringify({
            type: 'watch_file_tree',
            broadcastingRoomId,
          }));
        } else {
          ws.current.send(JSON.stringify({
            type: 'get_file_tree',
            broadcastingRoomId,
          }));
        }

        hasSentInitialRequest.current = true;
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };

    return () => {
      isReady.current = false;
      setReadyToSend(false);
      hasSentInitialRequest.current = false;
      previousFileContents.current = {};
      initialFileContents.current = null;
      ws.current?.close();
    };
  }, [onMessage, broadcastingRoomId]);

  useEffect(() => {
    if (!readyToSend || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    if (!fileContents || Object.keys(fileContents).length === 0) return;

    Object.entries(fileContents).forEach(([id, { name, content, path }]) => {
      if (!name || !path || content == null) return;

      const prev = previousFileContents.current[id];
      if (prev && prev.content === content && prev.path === path && prev.name === name) return;

      const message = {
        type: 'update_file_content',
        broadcastingRoomId,
        payload: {
          file: {
            id,
            name,
            path,
            content,
          },
        },
      };

      ws.current.send(JSON.stringify(message));
      previousFileContents.current[id] = { name, path, content };
    });
  }, [fileContents, broadcastingRoomId, readyToSend]);

  return ws;
}
