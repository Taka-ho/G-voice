import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ContextMenu from './ContextMenu';
import '../css/FileTree.scss';

const fileIcons = {
  js: '/icons/js-icon.png',
  jsx: '/icons/react-icon.png',
  ts: '/icons/ts-icon.png',
  tsx: '/icons/react-icon.png',
  html: '/icons/html-icon.png',
  css: '/icons/css-icon.png',
};

const FileTree = ({ fileNames, setFileNames, fileAndContents, updateFileContents }) => {
  const [treeData, setTreeData] = useState(() => {
    const storedTreeData = localStorage.getItem('treeData');
    return storedTreeData ? JSON.parse(storedTreeData) : {
      id: 1,
      name: 'root',
      children: [
        {
          
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('treeData', JSON.stringify(treeData));
  }, [treeData]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      const url = new URL(window.location.href);
      const containerId = url.searchParams.get('containerId');
      console.log('Container ID:', containerId);

      const message = JSON.stringify({ treeData, containerId, fileAndContents: fileAndContents });
      ws.send(message);
    };

    ws.onmessage = (event) => {
      const fileEvent = JSON.parse(event.data);
      console.log('File event received:', fileEvent);

      if (fileEvent.type === 'rename' || fileEvent.type === 'change') {
        if (!fileEvent.isDirectory && fileEvent.type === 'rename') {
          setTreeData((prevTreeData) => deleteNodeByName(prevTreeData, fileEvent.filename));
        }
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
      if (!fileNames.some(file => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);
        updateFileContents(openedFile.name, fileAndContents[openedFile.name] || '');
      }
    }
  };

  const handleFileDeleted = (nodeId) => {
    const updatedTreeData = deleteNodeById(treeData, nodeId);
    setTreeData(updatedTreeData);
  };

  const handleFileRenamed = (updatedNode) => {
    setTreeData((prevTreeData) => {
      if (!prevTreeData.children) return prevTreeData;

      const updatedChildren = prevTreeData.children.map((child) => {
        if (child.id === updatedNode.id) {
          return updatedNode;
        }
        return child;
      });
      return { ...prevTreeData, children: updatedChildren };
    });
  };

  const renderTree = (node) => {
    if (!node) {
      return null;
    }
    const ext = node.name.split('.').pop();
    const icon = fileIcons[ext];

    return (
      <li key={node.id}>
        <div onClick={() => clickedFile(node)} style={{ display: 'flex', alignItems: 'center' }}>
          {icon && <img src={icon} alt={ext} style={{ marginRight: '8px' }} />}
          {node.name}
        </div>
        {node.children && (
          <ul>
            {node.children.map((child) => renderTree(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ display: 'flex-grow' }}>
      <div style={{ marginRight: '1rem' }}>
        <ul>
          <ContextMenu
            data={treeData}
            indent={0}
            onDelete={(node) => handleFileDeleted(node.id)}
            onClick={clickedFile}
            onFileDeleted={handleFileDeleted}
            onFileRenamed={handleFileRenamed}
            setTreeData={setTreeData}
          />
        </ul>
      </div>
    </div>
  );
};

export default FileTree;
