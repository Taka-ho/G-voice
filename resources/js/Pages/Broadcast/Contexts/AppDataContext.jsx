import React, { createContext, useContext, useState, useEffect } from 'react';

export const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [fileContents, setFileContents] = useState({});
  const [treeData, setTreeData] = useState(() => {
    const stored = localStorage.getItem('treeData');
    return stored ? JSON.parse(stored) : null;
  });

  const [comments, setComments] = useState([]);

  // ファイル名をキーとしたファイル内容データ構造
  const [fileAndContents, setFileAndContents] = useState({});

  useEffect(() => {
    fetch('/api/comments')
      .then(res => res.json())
      .then(data => setComments(data))
      .catch(() => setComments([]));
  }, []);

  useEffect(() => {
    if (treeData !== null) {
      localStorage.setItem('treeData', JSON.stringify(treeData));
      const newFileAndContents = extractFilesFromTree(treeData);
      setFileAndContents(newFileAndContents);
    }
  }, [treeData]);

  const extractFilesFromTree = (node) => {
    let files = {};

    const traverse = (currentNode) => {
      if (!currentNode) return;

      if (!currentNode.children) {
        // ファイルノード
        files[currentNode.name] = {
          id: currentNode.id,
          name: currentNode.name,
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

    setFileAndContents(prev => ({
      ...prev,
      [fileName]: { id: fileId, name: fileName, content: newContent }
    }));
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
      fileAndContents, // <-- 追加
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
