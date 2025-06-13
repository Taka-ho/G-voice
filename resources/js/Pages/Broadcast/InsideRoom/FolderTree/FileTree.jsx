import React from 'react';
import ContextMenu from './ContextMenu';
import { useAppData } from '../../Contexts/AppDataContext';
import useWebSocket from './useWebSocket';

const FileTree = ({ fileNames, setFileNames, updateFileContents }) => {
  const {
    treeData,
    setTreeData,
    fileAndContents,
  } = useAppData();
  // WebSocket からメッセージを受け取ったときの処理
  const handleWebSocketMessage = (message) => {
    if (message.type === 'file_tree') {
      setTreeData(message.data); // ツリー情報をセット
    }

    // 必要に応じて他のメッセージも処理可能
    // if (message.type === 'file_created') ...
  };

  // WebSocket フックを呼び出す
  useWebSocket(handleWebSocketMessage);

  const clickedFile = (clickedFile) => {
    if (!clickedFile.children) {
      const openedFile = {
        id: clickedFile.id,
        name: clickedFile.name,
        path: clickedFile.path,
      };

      if (!fileNames.some((file) => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);

        const content = fileAndContents?.[openedFile.name]?.content ?? '';
        updateFileContents(openedFile.id, openedFile.name, content);
      }
    }
  };

  if (!treeData) return <div>Loading tree...</div>;

  return (
    <div style={{ overflowY: 'auto' }}>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        <ContextMenu
          data={treeData}
          indent={0}
          onClick={clickedFile}
          setTreeData={setTreeData}
        />
      </ul>
    </div>
  );
};

export default FileTree;
