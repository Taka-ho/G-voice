import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useAppData } from '../../Contexts/AppDataContext';
import useWebSocket from './useWebSocket';
import FileIcon from './FileIcon';
import ContextMenu from './ContextMenu';

const FileTree = ({ fileNames, setFileNames, updateFileContents }) => {
  const {
    treeData,
    setTreeData,
    broadcastingRoomId,
    fileAndContents,
    setFileContents,
  } = useAppData();

  const [expandedDirs, setExpandedDirs] = useState({});
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetNode: null });
  const contextMenuRef = useRef(null);

  const handleWebSocketMessage = useCallback((message) => {
    if (message.type === 'file_tree') {
      setTreeData(message.data);
    } else if (message.type === 'file_system_event' && message.payload?.data?.updatedTree) {
      setTreeData(message.payload.data.updatedTree);
    }
  }, [setTreeData]);

  const ws = useWebSocket(handleWebSocketMessage);

  const clickedFile = (clickedFile) => {
    if (clickedFile.children) {
      setExpandedDirs(prev => ({
        ...prev,
        [clickedFile.path]: !prev[clickedFile.path],
      }));
    } else {
      const openedFile = {
        id: clickedFile.id,
        name: clickedFile.name,
        path: clickedFile.path,
      };

      if (!fileNames.some((file) => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);

        const content = fileAndContents?.[openedFile.name]?.content ?? '';
        updateFileContents(openedFile.id, openedFile.name, content, openedFile.path);
      }
    }
  };

  const handleContextMenu = (event, node) => {
    event.preventDefault();
    event.stopPropagation(); // prevent bubbling to parent nodes

    // only trigger once for the direct element that was right-clicked
    if (event.currentTarget !== event.target && !event.currentTarget.contains(event.target)) return;

    const minimalNode = {
      id: node.id,
      name: node.name,
      path: node.path,
      type: node.type,
      children: node.type === 'directory' ? node.children : null,
    };

    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, targetNode: minimalNode });
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, targetNode: null });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const renderTree = (node, indent = 0) => {
    const isFolder = node.children && Array.isArray(node.children);
    const isOpen = expandedDirs[node.path];

    return (
      <li key={node.id} style={{ marginLeft: `${indent}rem` }}>
        <div
          className="tree-item"
          onClick={() => clickedFile(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          style={{ cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center' }}
        >
          {isFolder ? (
            <span style={{ marginRight: '4px' }}>{isOpen ? '📂' : '📁'}</span>
          ) : (
            <span style={{ marginRight: '4px' }}><FileIcon fileName={node.name} /></span>
          )}
          {node.name}
        </div>
        {isFolder && isOpen && (
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {node.children.map(child => renderTree(child, indent + 1))}
          </ul>
        )}
      </li>
    );
  };

  const findNodeByPath = (node, path) => {
    if (!node) return null;
    if (node.path === path) return node;
    if (Array.isArray(node.children)) {
      for (let child of node.children) {
        const found = findNodeByPath(child, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleRenameSuccess = (oldPath, newName, updatedTree) => {
    const newPath = oldPath.replace(/[^/]+$/, newName);

    setFileNames(prev =>
      prev.map(file => {
        if (file.path === oldPath) {
          const updatedNode = findNodeByPath(updatedTree, newPath);
          return updatedNode
            ? { ...file, id: updatedNode.id, name: updatedNode.name, path: updatedNode.path }
            : { ...file, name: newName, path: newPath };
        }
        const node = findNodeByPath(updatedTree, file.path);
        return node ? { ...file, id: node.id } : file;
      })
    );

    setFileContents(prev => {
      const updated = { ...prev };
      Object.entries(prev).forEach(([key, value]) => {
        if (value.path === oldPath) {
          delete updated[key];
          const updatedNode = findNodeByPath(updatedTree, newPath);
          if (updatedNode) {
            updated[updatedNode.id] = { ...value, name: updatedNode.name, path: updatedNode.path, id: updatedNode.id };
          } else {
            updated[key] = { ...value, name: newName, path: newPath };
          }
        }
      });
      return updated;
    });
  };

  if (!treeData) {
    return <div style={{ color: '#999', textAlign: 'center', marginTop: 32 }}>ファイルツリーを取得中...</div>;
  }
  

  return (
    <div style={{ overflowY: 'auto' }}>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {renderTree(treeData)}
      </ul>
      {contextMenu.visible && contextMenu.targetNode && (
        <ContextMenu
          ref={contextMenuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          targetNode={contextMenu.targetNode}
          onClose={() => setContextMenu({ visible: false, x: 0, y: 0, targetNode: null })}
          onRename={handleRenameSuccess}
        />
      )}
    </div>
  );
};

export default FileTree;
