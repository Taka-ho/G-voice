import React, { useState, useEffect } from 'react';
import '../css/FileTree.scss';
import ContextMenu from './ContextMenu';

const FileTree = ({ fileNames, setFileNames }) => {
  const [treeData, setTreeData] = useState(() => {
    // localStorageからtreeDataを読み込みます
    const storedTreeData = localStorage.getItem('treeData');
    return storedTreeData ? JSON.parse(storedTreeData) : {
      id: 1,
      name: 'root',
      children: [
        {
          id: 2,
          name: 'Folder 1',
          children: [
            { id: 3, name: 'File 1', content: [] },
            { id: 4, name: 'File 2', content: [] },
          ],
        },
        {
          id: 5,
          name: 'Folder 2',
          children: [
            { id: 6, name: 'File 3', content: [] },
          ],
        },
      ],
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
      }
    }
  };

  const handleFileDeleted = (nodeId) => {
    const updatedTreeData = deleteNodeById(treeData, nodeId);
    setTreeData({ ...updatedTreeData });
  };

  const handleFileRenamed = (updatedNode) => {
    setTreeData(prevTreeData => {
      const updatedChildren = prevTreeData.children.map(child => {
        if (child.id === updatedNode.id) {
          return updatedNode;
        }
        return child;
      });
      return { ...prevTreeData, children: updatedChildren };
    });
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
