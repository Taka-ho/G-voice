// FileManagerContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import { useAppData } from './AppDataContext';

const FileManagerContext = createContext();

export const FileManagerProvider = ({ children }) => {
  const { fileContents } = useAppData();

  useEffect(() => {
    if (!fileContents) return;

    const updateTreeDataFromFileAndContents = () => {
      const treeData = JSON.parse(localStorage.getItem('treeData') || '{}');
      if (!treeData || !Array.isArray(treeData.children)) return;

      const updatedTree = {
        ...treeData,
        children: treeData.children.map(file => {
          if (fileContents[file.id]) {
            return {
              ...file,
              content: fileContents[file.id].content,
            };
          }
          return file;
        }),
      };

      localStorage.setItem('treeData', JSON.stringify(updatedTree));
      window.dispatchEvent(new CustomEvent('treeDataUpdated', { detail: updatedTree }));
    };

    updateTreeDataFromFileAndContents();
  }, [fileContents]);

  return (
    <FileManagerContext.Provider value={{}}>
      {children}
    </FileManagerContext.Provider>
  );
};

export const useFileManager = () => useContext(FileManagerContext);
