import React, { useState } from 'react';
import Editor from '../Editor.jsx';
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
                indent={indent + 0.5}
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

  export default TreeNode;