import React, { useCallback, useEffect, useState } from 'react';
import FolderTree, { testData } from 'react-folder-tree';
import 'react-folder-tree/dist/style.css';
import './css/FileTree.css';
import Editor from './Editor';

const FileTree = () => {
  const onTreeStateChange = (state, event) => {
    const jsonString = JSON.stringify(state, null, 1);
    console.log(jsonString);
    <Editor fileAndFolder={state} />
  }

const selectedFile = (state) => {
  console.log(state);
}
  const treeState = {
      name: 'my-app',
      children: [
        {
          name: 'src',
          children: [
            { name: 'index.js' },
            { name: 'components', children: [{ name: 'Header.js' }, { name: 'Footer.js' }] },
          ],
        },
        { name: 'public', children: [{ name: 'index.html' }] },
      ],
  };
  return (
    <FolderTree
      data={treeState}
      onChange={ onTreeStateChange }
      showCheckbox={false}
    />
  );
};

export default FileTree;
