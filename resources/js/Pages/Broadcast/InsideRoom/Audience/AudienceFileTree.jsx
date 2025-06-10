import React, { useEffect, useState } from 'react';
import '../css/FileTree.scss';
import { useParams } from 'react-router-dom';

const AudienceFileTree = ({ fileNames, setFileNames, updateFileContents, fileAndContents }) => {
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
  const [currentItemName, setCurrentItemName] = useState(''); // 現在のアイテム名を管理
  const { broadcastingRoomId } = useParams();

  useEffect(() => {
    console.log(fileAndContents);
    console.log(treeData);
    const ws = new WebSocket('ws://localhost:8080');

    console.log(broadcastingRoomId);
    ws.onopen = () => {
      const message = JSON.stringify({ broadcastingRoomId, treeData, fileAndContents, pathBeforeChange, pathAfterChange, pathOfDeleteFile });
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
      console.log(clickedFile.name);
      const openedFile = { id: clickedFile.id, name: clickedFile.name, path: clickedFile.path };
      if (!fileNames.some((file) => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);
  
        const content = fileAndContents?.[openedFile.name] ?? ''; // ←安全にアクセス
        updateFileContents(openedFile.name, content);
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

  const renderTree = (node) => {
    return (
      <li key={node.id}>
        <div onClick={() => clickedFile(node)} onContextMenu={(e) => {
          e.preventDefault();
          setCurrentItemName(node.name); // コンテキストメニューのためにアイテム名を設定
        }}>
          {node.name} {node.children ? (node.isOpen ? '-' : '+') : null}
        </div>
        {node.isOpen && node.children && node.children.length > 0 && (
          <ul>
            {node.children.map(renderTree)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ display: 'flex-grow' }}>
      <div style={{ marginRight: '1rem' }}>
      </div>
    </div>
  );
};

export default AudienceFileTree;
