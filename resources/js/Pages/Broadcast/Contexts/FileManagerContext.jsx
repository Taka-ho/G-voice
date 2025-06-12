import React, { createContext, useContext, useEffect } from 'react';
import { useAppData } from './AppDataContext';

const FileManagerContext = createContext();

export const FileManagerProvider = ({ children }) => {
  const { fileContents, treeData } = useAppData();

  useEffect(() => {
    if (!fileContents || !treeData || !Array.isArray(treeData.children)) return;

    const updateTreeDataFromFileAndContents = () => {
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

      window.dispatchEvent(new CustomEvent('treeDataUpdated', { detail: updatedTree }));
    };

    updateTreeDataFromFileAndContents();
  }, [fileContents, treeData]); // ✅ treeData を依存配列に追加

  return (
    <FileManagerContext.Provider value={{}}>
      {children}
    </FileManagerContext.Provider>
  );
};

export const useFileManager = () => useContext(FileManagerContext);
