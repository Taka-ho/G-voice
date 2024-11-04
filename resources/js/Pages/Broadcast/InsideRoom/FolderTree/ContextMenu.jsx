import React, { useState, useRef, useEffect } from 'react';
import 'devicon/devicon.min.css';
import FileIcon from './FileIcon';

const ContextMenu = ({
  data,
  indent,
  onDelete,
  onClick,
  onFileRenamed,
  setTreeData,
  pathBeforeChange,
  pathAfterChange,
  setPathBeforeChange,
  setPathAfterChange,
}) => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const popupRef = useRef(null);
  const [rootDirName, setRootDirName] = useState('');

  useEffect(() => {
    // localStorageからtreeDataを取得
    const storedTreeData = localStorage.getItem('treeData');
    if (storedTreeData) {
      const treeData = JSON.parse(storedTreeData);
      // 最上位の親要素のフォルダー名を取得
      setRootDirName(treeData.name);
    }
  }, []);

  const clickedFile = () => {
    onClick(data);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    closeContextMenu();
  };

  const closeContextMenu = () => {
    document.body.addEventListener('click', documentClickHandler);
  };

  const documentClickHandler = (e) => {
    if (popupRef.current && popupRef.current.contains(e.target)) return;
    setContextMenu({ visible: false, x: 0, y: 0 });
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
    let path;
    if (parentNode.path == undefined){
      path = `${rootDirName}/NewFile.txt`
    } else {
      path = `${rootDirName}/${parentNode.path}/NewFile.txt`
    }
    const newFile = { id: Date.now(), name: 'NewFile.txt', content: '', path: path};
    const updatedNode = {
      ...parentNode,
      children: [...(parentNode.children || []), newFile],
    };
    setTreeData((prevTreeData) => updateNodeById(prevTreeData, parentNode.id, updatedNode));
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const addFolder = (parentNode) => {
    const newFolder = { id: Date.now(), name: 'NewFolder', children: [], path: `${rootDirName}/${parentNode.path}/NewFolder` };
    const updatedNode = {
      ...parentNode,
      children: [...(parentNode.children || []), newFolder],
    };
    setTreeData((prevTreeData) => updateNodeById(prevTreeData, parentNode.id, updatedNode));
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const renameItem = (node) => {
    // 変更前のパスを保存
    setPathBeforeChange(node.path);

    const newName = prompt('Enter new name:', node.name);
    if (newName !== null) {
      const updatedNode = {
        ...node,
        name: newName,
        path: node.path.replace(/\/[^/]+$/, `/${newName}`), // 新しいパスを計算
      };

      // 変更後のパスを保存
      setPathAfterChange(updatedNode.path);

      setTreeData((prevTreeData) => updateNodeById(prevTreeData, node.id, updatedNode));
      onFileRenamed(updatedNode);
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleDelete = (node) => {
    onDelete(node);
    setContextMenu({ visible: false, x: 0, y: 0 });
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
        zIndex: 1000,
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
          <div className='contextMenu' onClick={() => handleDelete(data)}>
            削除する
          </div>
        </div>
      ) : (
        <div className='file-context-menu'>
          <div className='contextMenu' onClick={() => renameItem(data)}>
            名前の変更
          </div>
          <div className='contextMenu' onClick={() => handleDelete(data)}>
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
              pathBeforeChange={pathBeforeChange}
              pathAfterChange={pathAfterChange}
              setPathBeforeChange={setPathBeforeChange}
              setPathAfterChange={setPathAfterChange}
            />
          ))}
        </ul>
      )}
      {contextMenuContent}
    </li>
  );
};

export default ContextMenu;
