import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket from '../InsideRoom/FolderTree/useWebSocket';
import { useParams } from 'react-router-dom';

export const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [fileContents, setFileContents] = useState({});
  const [treeData, setTreeData] = useState(() => {
    const stored = localStorage.getItem('treeData');
    return stored ? JSON.parse(stored) : null;
  });
  const [comments, setComments] = useState([]);
  const [fileAndContents, setFileAndContents] = useState({});

  const { broadcastingRoomId } = useParams();
  const ws = useWebSocket((message) => {
    const { type, payload } = message;

    if (type === 'file_system_event') {
      console.log('Received file system update from WebSocket:', message);
      const updatedTree = payload?.data?.updatedTree;
      if (updatedTree) setTreeData(updatedTree);
    } else if (type === 'file_content_update') {
      console.log('Received file content update from WebSocket:', message);
      const { fileName, newContent } = payload.data;

      setFileAndContents(prev => ({
        ...prev,
        [fileName]: {
          ...prev[fileName],
          content: newContent
        }
      }));
    }
  });

  useEffect(() => {
    fetch('/api/comments')
      .then(res => res.json())
      .then(data => setComments(data))
      .catch(() => setComments([]));
  }, []);

  useEffect(() => {
    if (treeData !== null) {
      const newFileAndContents = extractFilesFromTree(treeData);
      setFileAndContents(newFileAndContents);

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'file_system_event',
          payload: {
            eventType: 'fullTreeUpdate',
            broadcastingRoomId,
            data: { updatedTree: treeData }
          }
        }));
      }
    }
  }, [treeData, ws, broadcastingRoomId]);

  const extractFilesFromTree = (node) => {
    let files = {};
    const traverse = (currentNode) => {
      if (!currentNode) return;
      if (!currentNode.children) {
        files[currentNode.name] = {
          id: currentNode.id,
          name: currentNode.name,
          path: currentNode.path,
          content: currentNode.content || '',
        };
      } else if (Array.isArray(currentNode.children)) {
        currentNode.children.forEach(child => traverse(child));
      }
    };
    traverse(node);
    return files;
  };

  const addComment = (newComment) => {
    fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      credentials: 'include',
      body: JSON.stringify(newComment),
    })
      .then(res => res.json())
      .then(data => setComments(prev => [...prev, data]))
      .catch(() => {});
  };

  const updateFileContents = (fileId, fileName, newContent) => {
    setFileContents(prev => ({
      ...prev,
      [fileId]: { name: fileName, content: newContent }
    }));

    setFileAndContents(prev => {
      const updated = {
        ...prev,
        [fileName]: { id: fileId, name: fileName, content: newContent }
      };

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'file_content_update',
          payload: {
            eventType: 'updateFileContent',
            broadcastingRoomId,
            data: { fileId, fileName, newContent }
          }
        }));
      }
      return updated;
    });
  };

  return (
    <AppDataContext.Provider value={{
      fileContents,
      setFileContents,
      treeData,
      setTreeData,
      comments,
      addComment,
      updateFileContents,
      fileAndContents,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === null) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
