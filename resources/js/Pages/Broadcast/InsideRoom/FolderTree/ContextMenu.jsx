import React, { useEffect, useRef, forwardRef } from 'react';
import axios from 'axios';
import { useAppData } from '../../Contexts/AppDataContext';

const ContextMenu = forwardRef(({ x, y, targetNode, onClose, onRename }, ref) => {
  const { broadcastingRoomId, setTreeData } = useAppData();

  const requestServerChange = async (type, payload) => {
    try {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = '3000';
  
      const url = `${protocol}//${hostname}:${port}/api/fs-operation`;
    
      const res = await axios.post(url, {
        type,
        broadcastingRoomId,
        payload,
      }, {
        withCredentials: true
      });
  
      const success = res.data.success;
      const updatedTree = res.data.updatedTree;
  
      if (success && updatedTree) {
        setTreeData(updatedTree);
      }
  
      return { success, updatedTree };
    } catch (err) {
      console.error('ContextMenu API Error:', err);
      return false;
    }
  };  

  const handleRename = async () => {
    const newName = prompt('新しい名前を入力してください', targetNode.name);
    if (!newName || newName === targetNode.name) return;

    const { success, updatedTree } = await requestServerChange('rename', {
      oldPath: targetNode.path,
      newName,
      isFolder: !!targetNode.children,
    });

    if (success) {
      if (onRename) {
        onRename(targetNode.path, newName, updatedTree);
      }
      onClose();
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(`${targetNode.name} を削除しますか？`);
    if (!confirmed) return;

    const { success } = await requestServerChange('delete', {
      path: targetNode.path,
      isFolder: !!targetNode.children,
    });

    if (success) onClose();
  };

  const handleAddFile = async () => {
    const fileName = prompt('新しいファイル名を入力してください', 'NewFile.txt');
    if (!fileName) return;
  
    const { success, updatedTree, message } = await requestServerChange('addFile', {
      parentPath: targetNode.path,
      name: fileName,
    });

    if (!success && message) {
      alert(message);
      return;
    }
    if (success) onClose();
  };

  const handleAddFolder = async () => {
    const folderName = prompt('新しいフォルダ名を入力してください', 'NewFolder');
    if (!folderName) return;
  
    const { success, updatedTree, message } = await requestServerChange('addFolder', {
      parentPath: targetNode.path,
      name: folderName,
    });

    if (!success && message) {
      alert(message);
      return;
    }
    if (success) onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const isFolder = !!targetNode?.children;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: y,
        left: x,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '6px',
        width: 180,
        padding: '4px 0',
      }}
    >
      <div className="contextMenuItem" onClick={handleRename}>✏️ 名前を変更</div>
      {isFolder && (
        <>
          <div className="contextMenuItem" onClick={handleAddFile}>📄 ファイルを追加</div>
          <div className="contextMenuItem" onClick={handleAddFolder}>📁 フォルダを追加</div>
        </>
      )}
      <div className="contextMenuItem" onClick={handleDelete}>🗑️ 削除</div>
    </div>
  );
});

export default ContextMenu;
