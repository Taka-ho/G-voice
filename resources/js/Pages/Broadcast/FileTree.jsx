import React, { useState } from 'react';
import './css/FileTree.scss';
import './css/Editor.css';
import './css/Tab.css';

const TreeNode = ({ data, onAddFile, indent, onAddFolder, onRename, onDelete }) => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [isContextMenuFocused, setContextMenuFocused] = useState(false);

  const getParentName = (currentNode, targetId, parentName = null) => {
    if (currentNode.id === targetId) {
      return parentName;
    }
  
    if (currentNode.children) {
      for (const childNode of currentNode.children) {
        const result = getParentName(childNode, targetId, currentNode.name);
        if (result !== null) {
          return result;
        }
      }
    }
    return null;
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    setContextMenuFocused(true);
    document.body.addEventListener('click', (e) => {
      setContextMenu({ visible: false, x: 0, y: 0 });
      setContextMenuFocused(false);
      document.body.removeEventListener('click', documentClickHandler);
    });
  };

  const documentClickHandler = (e) => {
    if (popupRef.current.contains(e.target)) return;
    setContextMenu({ visible: false, x: 0, y: 0 });
    setContextMenuFocused(false);
    document.body.removeEventListener('click', documentClickHandler);
  };

  const isFolder = !data.children;
  const contextMenuContent = contextMenu.visible && (
    <div
      style={{
        position: 'absolute',
        top: isFolder ? contextMenu.y - 15 : contextMenu.y,
        left: contextMenu.x,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        padding: '4px',
      }}
    >
      {isFolder ? (
        <div className='file-context-menu'>
          <div className='contextMenu' onClick={() => onRename(data)}>
            名前の変更
          </div>
          <div className='contextMenu' onClick={() => onDelete(data)}>
            削除する
          </div>
        </div>
      ) : (
        <div className='folder-context-menu'>
          <div className='contextMenu' onClick={() => onRename(data)}>
            名前の変更
          </div>
          <div className='contextMenu' onClick={() => onAddFile(data)}>
            ファイルを追加する
          </div>
          <div className='contextMenu' onClick={() => onAddFolder(data)}>
            フォルダの追加
          </div>
          <div className='contextMenu' onClick={() => onDelete(data)}>
            削除する
          </div>
        </div>
      )}
    </div>
  );

  return (
    <li style={{ marginLeft: `${indent}rem` }} onContextMenu={handleContextMenu}>
      <div className='data'>
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          className='bi bi-folder'
          fill='currentColor'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            d='M2 1a1 1 0 0 1 1-1h3.414l1 1H12a1 1 0 0 1 1 1v1H2V1zm1-1a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-8.172l-1-1H3z'
          />
        </svg>
        {data.name}
      </div>

      {data.children && (
        <ul>
          {data.children.map((child) => (
            <TreeNode
              key={child.id}
              data={child}
              indent={indent + 1}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
      {contextMenuContent}
    </li>
  );
};

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
      const updatedChildren = node.children.map(child => {
        const updatedChild = deleteNodeById(child, id);
        return updatedChild !== null ? updatedChild : null;
      }).filter(child => child !== null);

      return { ...node, children: updatedChildren };
    }

    return node;
  }

  const deleteNode = (target) => {
    console.log(target);
    const id = target.id;
    const updatedTreeData = deleteNodeById(treeData, id);
    setTreeData({ ...updatedTreeData });
  }

  return (
  <div style={{ display: 'flex' }}>
  <ul style={{ marginLeft: `1rem` }}>
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
  );
  
};

export default FileTree;
