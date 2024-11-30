import React, { useEffect, useState } from 'react';
import ContextMenu from './ContextMenu';
import '../css/FileTree.scss';

const FileTree = ({ fileNames, setFileNames, fileAndContents, updateFileContents }) => {
  const [treeData, setTreeData] = useState(() => {
    const storedTreeData = localStorage.getItem('treeData');
    return storedTreeData
      ? JSON.parse(storedTreeData)
      : {
          id: 1,
          name: 'root',
          path: 'root',
          children: [],
        };
  });

  const [pathBeforeChange, setPathBeforeChange] = useState('');
  const [pathAfterChange, setPathAfterChange] = useState('');
  const [pathOfDeleteFile, setPathOfDeleteFile] = useState('');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      
      const queryString = window.location.search;
      const params = new URLSearchParams(queryString);
      const containerId = params.get('containerId');
      const message = JSON.stringify({ treeData, containerId, fileAndContents, pathBeforeChange, pathAfterChange, pathOfDeleteFile });
      ws.send(message);
    };

    ws.onmessage = (event) => {
      const fileEvent = JSON.parse(event.data);
      if (fileEvent.type === 'add') {
        // Add file to the file tree
      } else if (fileEvent.type === 'change') {
        // Update file content
      } else if (fileEvent.type === 'remove') {
        setTreeData((prevTreeData) => deleteNodeById(prevTreeData, fileEvent.fileName));
      }
    };

    return () => {
      ws.close();
    };
  }, [treeData, fileAndContents]);

  const deleteNodeById = (node, id) => {
    if (node.id === id) {
      return null;
    }

    if (node.children && node.children.length > 0) {
      const updatedChildren = node.children
        .map((child) => {
          const updatedChild = deleteNodeById(child, id);
          return updatedChild !== null ? updatedChild : null;
        })
        .filter((child) => child !== null);

      return { ...node, children: updatedChildren };
    }

    return node;
  };

  const clickedFile = (clickedFile) => {
    if (!clickedFile.children) {
      const openedFile = { id: clickedFile.id, name: clickedFile.name, path: clickedFile.path };
      if (!fileNames.some((file) => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);
        updateFileContents(openedFile.name, fileAndContents[openedFile.name] || '');
      }
    }
  };

  const handleFileDeleted = (node) => {
    const pathOfDeleteFile = node.path; // node.pathを取得
    setPathOfDeleteFile(pathOfDeleteFile); // pathOfDeleteFileをセット
    const updatedTreeData = deleteNodeById(treeData, node.id);
    if (updatedTreeData) {
      setTreeData(updatedTreeData);
      localStorage.setItem('treeData', JSON.stringify(updatedTreeData));
    }

    // WebSocketを使用して削除処理を送信
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      const message = JSON.stringify({ action: 'delete', path: pathOfDeleteFile });
      ws.send(message);
    };

    // pathOfDeleteFileを空に戻す
    setPathOfDeleteFile('');
  };

  const handleFileRenamed = (updatedNode) => {
    const updateNode = (node, updatedNode) => {
      if (node.id === updatedNode.id) {
        return {
          ...node,
          name: updatedNode.name,
          path: updatedNode.path,
        };
      }

      if (node.children && node.children.length > 0) {
        const updatedChildren = node.children.map((child) => updateNode(child, updatedNode));
        return { ...node, children: updatedChildren };
      }
      return node;
    };

    setTreeData((prevTreeData) => {
      const updatedTree = updateNode(prevTreeData, updatedNode);
      localStorage.setItem('treeData', JSON.stringify(updatedTree));
      return updatedTree;
    });
  };

  return (
    <div style={{ display: 'flex-grow' }}>
      <div style={{ marginRight: '1rem' }}>
        <ul>
          <ContextMenu
            data={treeData}
            indent={0}
            onDelete={handleFileDeleted}
            onClick={clickedFile}
            onFileRenamed={handleFileRenamed}
            setTreeData={setTreeData}
            pathBeforeChange={pathBeforeChange}
            pathAfterChange={pathAfterChange}
            setPathBeforeChange={setPathBeforeChange}
            setPathAfterChange={setPathAfterChange}
            setPathOfDeleteFile={setPathOfDeleteFile}
          />
        </ul>
      </div>
    </div>
  );
};

export default FileTree;
