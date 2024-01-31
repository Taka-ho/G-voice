import React, { useState } from 'react';
import './css/FileTree.scss';
import ContextMenu from './FolderTree/ContextMenu';


const FileTree = () => {
  const [treeData, setTreeData] = useState({
    id: 1,
    name: 'root',
    children: [
      {
        id: 2,
        name: 'Folder 1',
        children: [
          { id: 3, name: 'File 1' },
          { id: 4, name: 'File 2' },
        ],
      },
      {
        id: 5,
        name: 'Folder 2',
        children: [
          { id: 6, name: 'File 3' },
        ],
      },
    ],
  });

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

  const deleteNode = (target) => {
    const id = target.id;
    const updatedTreeData = deleteNodeById(treeData, id);
    setTreeData({ ...updatedTreeData });
  };

  return (
    <div style={{ display: 'flex-grow' }}>
        <div style={{ marginRight: '1rem' }}>
          <ul>
            <ContextMenu
              data={treeData}
              indent={0}
              onDelete={(node) => deleteNode(node)}
            />
          </ul>
      </div>
    </div>
    
  );
};

export default FileTree;
