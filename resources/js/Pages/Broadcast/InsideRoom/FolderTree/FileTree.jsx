import React, { useEffect, useState } from 'react';
import ContextMenu from './ContextMenu';
// パスを修正: web-app/resources/js/Pages/Broadcast/InsideRoom/FolderTree から
// web-app/resources/js/Pages/Broadcast/Contexts への相対パス
import { useAppData } from '../../Contexts/AppDataContext';

const FileTree = ({ fileNames, setFileNames, updateFileContents }) => {
  const { treeData, fileAndContents, setTreeData: setTreeDataFromContext } = useAppData();

  const clickedFile = (clickedFile) => {
    if (!clickedFile.children) {
      const openedFile = {
        id: clickedFile.id,
        name: clickedFile.name,
        path: clickedFile.path,
      };

      if (!fileNames.some((file) => file.id === openedFile.id || file.name === openedFile.name)) {
        setFileNames((prevFileNames) => [...prevFileNames, openedFile]);
        // fileAndContentsから内容を取得し、updateFileContentsに渡す
        const content = fileAndContents?.[openedFile.name]?.content ?? '';
        updateFileContents(openedFile.id, openedFile.name, content); // fileIdも渡すように変更
      }
    }
  };

  if (!treeData) return <div>Loading tree...</div>;

  return (
    <div style={{ overflowY: 'auto'}}>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        <ContextMenu
          data={treeData}
          indent={0}
          onClick={clickedFile}
          setTreeData={setTreeDataFromContext}
        />
      </ul>
    </div>
  );
};

export default FileTree;
