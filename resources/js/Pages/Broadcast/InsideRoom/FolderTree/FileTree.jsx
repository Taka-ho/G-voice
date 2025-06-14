// FileTree.js
import React, { useCallback, useState } from 'react';
import { useAppData } from '../../Contexts/AppDataContext';
import useWebSocket from './useWebSocket';
import FileIcon from './FileIcon';

const FileTree = ({ fileNames, setFileNames, updateFileContents }) => {
  const {
    treeData,
    setTreeData,
    fileAndContents,
  } = useAppData();

  const [expandedDirs, setExpandedDirs] = useState({});

  const handleWebSocketMessage = useCallback((message) => {
    if (message.type === 'file_tree') {
      setTreeData(message.data);
    }
  }, [setTreeData]);

  useWebSocket(handleWebSocketMessage);

  const clickedFile = (clickedFile) => {
    if (clickedFile.children) {
      setExpandedDirs(prev => ({
        ...prev,
        [clickedFile.path]: !prev[clickedFile.path],
      }));
    } else {
      const openedFile = {
        id: clickedFile.id,
        name: clickedFile.name,
        path: clickedFile.path,
      };

      if (!fileNames.some((file) => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);

        const content = fileAndContents?.[openedFile.name]?.content ?? '';
        updateFileContents(openedFile.id, openedFile.name, content, openedFile.path);
      }
    }
  };

  const renderTree = (node, indent = 0) => {
    const isFolder = node.children && Array.isArray(node.children);
    const isOpen = expandedDirs[node.path];

    return (
      <li key={node.id} style={{ marginLeft: `${indent}rem` }}>
        <div
          className="tree-item"
          onClick={() => clickedFile(node)}
          style={{ cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center' }}
        >
          {isFolder ? (
            <span style={{ marginRight: '4px' }}>{isOpen ? '📂' : '📁'}</span>
          ) : (
            <span style={{ marginRight: '4px' }}><FileIcon fileName={node.name} /></span>
          )}
          {node.name}
        </div>
        {isFolder && isOpen && (
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {node.children.map(child => renderTree(child, indent + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (!treeData) return <div>Loading tree...</div>;

  return (
    <div style={{ overflowY: 'auto' }}>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {renderTree(treeData)}
      </ul>
    </div>
  );
};

export default FileTree;
