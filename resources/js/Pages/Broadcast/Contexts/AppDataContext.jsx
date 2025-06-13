// AppDataContext.js

import React, { createContext, useContext, useState } from 'react';

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
  };

  return (
    <AppDataContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
