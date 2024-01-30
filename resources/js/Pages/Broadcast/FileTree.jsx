import React, { useState } from 'react';
import './css/FileTree.scss';
import TreeNode from './FolderTree/TreeNode.jsx';


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

  const [clicked, setClicked] = useState([]);
  const addFile = (parentNode) => {
    const newFile = { id: Date.now(), name: 'New File' };
    const newChildren = [...parentNode.children, newFile];
    parentNode.children = newChildren;
    setTreeData({ ...treeData });
  };

  const addFolder = (parentNode) => {
    const newFolder = { id: Date.now(), name: 'New Folder', children: [] };
    const newChildren = [...parentNode.children, newFolder];
    parentNode.children = newChildren;
    setTreeData({ ...treeData });
  };

  const renameItem = (node) => {
    const newName = prompt('Enter new name:', node.name);
    if (newName !== null) {
      node.name = newName;
      setTreeData({ ...treeData });
    }
  };

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
            <TreeNode
              data={treeData}
              indent={0}
              onAddFile={(node) => addFile(node)}
              onAddFolder={(node) => addFolder(node)}
              onRename={(node) => renameItem(node)}
              onDelete={(node) => deleteNode(node)}
            />
          </ul>
      </div>
    </div>
    
  );
};

export default FileTree;
