import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../../Contexts/AppDataContext';

export default function useWebSocket(onMessage, enable = true) {
  const ws = useRef(null);
  const isReady = useRef(false);
  const [readyToSend, setReadyToSend] = useState(false);
  const previousFileContents = useRef({});
  const hasSentInitialRequest = useRef(false);
  const { broadcastingRoomId, treeData, fileContents } = useAppData();

  // WebSocket 接続・初期ファイルツリーリクエスト
  useEffect(() => {
    if (!enable || !broadcastingRoomId) return;

    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      isReady.current = true;
      setReadyToSend(true);

      if (!hasSentInitialRequest.current) {
        const shouldWatch = treeData && (!fileContents || Object.keys(fileContents).length === 0);
        const type = shouldWatch ? 'watch_file_tree' : 'get_file_tree';

        ws.current.send(JSON.stringify({ type, broadcastingRoomId }));
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
      ws.current?.close();
    };
  }, [enable, onMessage, broadcastingRoomId]);

  // ファイル内容更新の送信（ファイル変更時のみ）
  useEffect(() => {
    if (!enable || !readyToSend || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    if (!fileContents || Object.keys(fileContents).length === 0) return;

    for (const [id, { name, content, path }] of Object.entries(fileContents)) {
      if (!name || !path || content == null) continue;

      const prev = previousFileContents.current[id];
      if (prev && prev.content === content && prev.path === path && prev.name === name) continue;

      ws.current.send(JSON.stringify({
        type: 'update_file_content',
        broadcastingRoomId,
        payload: { file: { id, name, path, content } },
      }));

      previousFileContents.current[id] = { name, path, content };
    }
  }, [fileContents, broadcastingRoomId, readyToSend, enable]);

  return ws;
}
