// AppDataContext.js

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const AppDataContext = createContext(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

export const AppDataProvider = ({ children }) => {
  const [fileContents, setFileContents] = useState({});
  const [broadcastingRoomId, setBroadcastingRoomId] = useState(null);
  const [fileAndContents, setFileAndContents] = useState({});
  const [treeData, setTreeData] = useState(null);
  const [comments, setComments] = useState([]);

  const addComment = useCallback((newComment) => {
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
    }, []);
    console.log(fileContents);
  const updateFileContents = useCallback((fileId, fileName, newContent, path) => {
    setFileContents(prev => ({
      ...prev,
      [fileId]: { name: fileName, content: newContent, path: path },
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      fileContents,
      setFileContents,
      broadcastingRoomId,
      setBroadcastingRoomId,
      treeData,
      setTreeData,
      comments,
      addComment,
      updateFileContents,
      fileAndContents,
    }),
    [
      fileContents,
      broadcastingRoomId,
      treeData,
      comments,
      addComment,
      updateFileContents,
      fileAndContents,
    ]
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );

};
