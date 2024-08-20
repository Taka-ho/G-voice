import React, { useState, useRef } from 'react';
import 'devicon/devicon.min.css';
import FileIcon from './FileIcon';

const ContextMenu = ({ data, indent, onDelete, onClick, onFileRenamed, setTreeData }) => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [isContextMenuFocused, setContextMenuFocused] = useState(false);
  const popupRef = useRef(null);

  const clickedFile = () => {
    onClick(data);
  };

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
    closeContextMenu();
  };

  const closeContextMenu = () => {
    document.body.addEventListener('click', documentClickHandler);
  };

  const documentClickHandler = (e) => {
    if (popupRef.current && popupRef.current.contains(e.target)) return;
    setContextMenu({ visible: false, x: 0, y: 0 });
    setContextMenuFocused(false);
    document.body.removeEventListener('click', documentClickHandler);
  };

  const updateNodeById = (node, id, updatedNode) => {
    if (node.id === id) {
      return updatedNode;
    }

    if (node.children) {
      const updatedChildren = node.children.map(child => updateNodeById(child, id, updatedNode));
      return { ...node, children: updatedChildren };
    }

    return node;
  };

  const addFile = (parentNode) => {
    const newFile = { id: Date.now(), name: 'NewFile', content: '' };
    const updatedNode = {
      ...parentNode,
      children: [...(parentNode.children || []), newFile]
    };
    setTreeData((prevTreeData) => updateNodeById(prevTreeData, parentNode.id, updatedNode));
  };

  const addFolder = (parentNode) => {
    const newFolder = { id: Date.now(), name: 'NewFolder', children: [] };
    const newChildren = [...parentNode.children, newFolder];
    parentNode.children = newChildren;
    setTreeData({ ...treeData });
  };

  const renameItem = (node) => {
    const newName = prompt('Enter new name:', node.name);
    if (newName !== null) {
      node.name = newName;
      onFileRenamed(node);
    }
  };

  const isFolder = data.children && Array.isArray(data.children);

  const contextMenuContent = contextMenu.visible && (
    <div
      ref={popupRef}
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
        <div className='folder-context-menu'>
          <div className='contextMenu' onClick={() => renameItem(data)}>
            名前の変更
          </div>
          <div className='contextMenu' onClick={() => addFile(data)}>
            ファイルを追加する
          </div>
          <div className='contextMenu' onClick={() => addFolder(data)}>
            フォルダの追加
          </div>
          <div className='contextMenu' onClick={() => onDelete(data)}>
            削除する
          </div>
        </div>
      ) : (
        <div className='file-context-menu'>
          <div className='contextMenu' onClick={() => renameItem(data)}>
            名前の変更
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
      <div className='data' onClick={clickedFile} style={{ display: 'flex', alignItems: 'center' }}>
        <FileIcon fileName={data.name} isFolder={isFolder} />
        {data.name}
      </div>
      {isFolder && (
        <ul>
          {data.children.map((child) => (
            <ContextMenu
              key={child.id}
              data={child}
              indent={indent + 0.5}
              onDelete={onDelete}
              onClick={onClick}
              onFileRenamed={onFileRenamed}
              setTreeData={setTreeData}
            />
          ))}
        </ul>
      )}
      {contextMenuContent}
    </li>
  );
};

export default ContextMenu;
