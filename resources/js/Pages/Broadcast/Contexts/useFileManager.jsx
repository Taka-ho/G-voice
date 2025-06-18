import { useEffect } from 'react';

const useFileManager = ({ fileAndContents } = {}) => {
  useEffect(() => {
    if (!fileAndContents) return;

    const updateTreeDataFromFileAndContents = () => {

      if (!treeData || !Array.isArray(treeData.children)) return;

      const updatedTree = {
        ...treeData,
        children: treeData.children.map(file => {
          if (fileAndContents[file.id]) {
            return {
              ...file,
              content: fileAndContents[file.id].content,
            };
          }
          return file;
        }),
      };

      const event = new CustomEvent('treeDataUpdated', { detail: updatedTree });
      window.dispatchEvent(event);
    };

    updateTreeDataFromFileAndContents();
  }, [fileAndContents]);
};

export default useFileManager;
