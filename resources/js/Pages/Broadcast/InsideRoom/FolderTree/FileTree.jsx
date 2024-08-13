import React, { useState, useEffect } from 'react';
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

const FileTree = ({ fileNames, fileContents, setFileNames, updateFileContents }) => {
  const [treeData, setTreeData] = useState(() => {
    const storedTreeData = localStorage.getItem('treeData');
    return storedTreeData ? JSON.parse(storedTreeData) : {
      id: 1,
      name: 'root',
      children: [
        {
          id: 2,
          name: 'Folder 1',
          children: [
            { id: 3, name: 'File 1.js', content: [] },
            { id: 4, name: 'File 2.tsx', content: [] },
          ],
        }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('treeData', JSON.stringify(treeData));
  }, [treeData]);

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
        updateFileContents(openedFile.name, fileContents[openedFile.name] || '');
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
