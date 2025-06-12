import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import useWebSocket from './useWebSocket';
import FileIcon from './FileIcon';
import { useParams } from 'react-router-dom';
import { useAppData } from '../../Contexts/AppDataContext';

let globalCloseContextMenu; // グローバルに追跡

const ContextMenu = ({
  data,
  indent,
  onClick,
}) => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const popupRef = useRef(null);
  const { broadcastingRoomId } = useParams();
  const { setTreeData } = useAppData(); // AppDataContextからsetTreeDataを取得
  const ws = useWebSocket((message) => { // useWebSocketからwsインスタンスを取得
    if (message.type === 'file-update' || message.type === 'file_system_event') {
      // サーバーからのファイルシステムイベントもここで処理
      setTreeData(message.updatedTree || message.payload.data.updatedTree); // サーバーからのツリー更新を適用
    }
  });

  const requestServerChange = async (type, payload) => {
    try {
      const res = await axios.post('/api/fs-operation', {
        type,
        broadcastingRoomId,
        payload,
      });
      const success = res.data.success;

      // サーバーでの操作が成功したらWebSocketで通知
      if (success && ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'file_system_event',
          payload: {
            eventType: type, // 'addFile', 'addFolder', 'rename', 'delete'
            broadcastingRoomId,
            data: { 
              ...payload, 
              // サーバーからの最新ツリー構造をWebSocket経由でクライアントに通知する場合に以下を追加
              // updatedTree: res.data.updatedTree // サーバーがツリー全体を返す場合
            }
          }
        }));
      }
      return success;
    } catch (err) {
      console.error('API Error:', err);
      return false;
    }
  };

  const addFile = async (parentNode) => {
    const fileName = prompt('新しいファイル名を入力してください', 'NewFile.txt');
    if (!fileName) return;

    const success = await requestServerChange('addFile', {
      parentPath: parentNode.path,
      name: fileName,
    });

    if (success) closeContextMenu();
  };

  const addFolder = async (parentNode) => {
    const folderName = prompt('新しいフォルダ名を入力してください', 'NewFolder');
    if (!folderName) return;

    const success = await requestServerChange('addFolder', {
      parentPath: parentNode.path,
      name: folderName,
    });

    if (success) closeContextMenu();
  };

  const renameItem = async (node) => {
    const newName = prompt('新しい名前を入力してください', node.name);
    if (!newName || newName === node.name) return;

    const success = await requestServerChange('rename', {
      oldPath: node.path,
      newName,
      isFolder: !!node.children // フォルダかどうかも渡す
    });

    if (success) closeContextMenu();
  };

  const handleDelete = async (node) => {
    const confirmDelete = confirm(`${node.name} を削除しますか？`);
    if (!confirmDelete) return;

    const success = await requestServerChange('delete', {
      path: node.path,
      isFolder: !!node.children // フォルダかどうかも渡す
    });

    if (success) closeContextMenu();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (globalCloseContextMenu) globalCloseContextMenu();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });

    globalCloseContextMenu = () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    };
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const isFolder = data.children && Array.isArray(data.children);
  const contextMenuContent = contextMenu.visible && (
    <div
      ref={popupRef}
      style={{
        position: 'absolute',
        top: contextMenu.y,
        left: contextMenu.x,
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        padding: '6px 0',
        zIndex: 9999,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontSize: '0.9rem',
        borderRadius: '6px',
        width: '160px',
        overflow: 'hidden',
      }}
    >
      {isFolder ? (
        <>
          <div className="contextMenuItem" onClick={() => renameItem(data)}>✏️ 名前を変更</div>
          <div className="contextMenuItem" onClick={() => addFile(data)}>📄 ファイルを追加</div>
          <div className="contextMenuItem" onClick={() => addFolder(data)}>📁 フォルダを追加</div>
          <div className="contextMenuItem" onClick={() => handleDelete(data)}>🗑️ 削除</div>
        </>
      ) : (
        <>
          <div className="contextMenuItem" onClick={() => renameItem(data)}>✏️ 名前を変更</div>
          <div className="contextMenuItem" onClick={() => handleDelete(data)}>🗑️ 削除</div>
        </>
      )}
    </div>
  );

  return (
    <li style={{ marginLeft: `${indent}rem` }} onContextMenu={handleContextMenu}>
      <div
        className="data"
        onClick={() => onClick(data)}
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '2px 6px' }}
      >
        <FileIcon fileName={data.name} isFolder={isFolder} />
        {data.name}
      </div>
      {isFolder && data.children && (
        <ul>
          {data.children.map((child) => (
            <ContextMenu
              key={child.id}
              data={child}
              indent={indent + 0.5}
              onClick={onClick}
            />
          ))}
        </ul>
      )}
      {contextMenuContent}
    </li>
  );
};

export default ContextMenu;
