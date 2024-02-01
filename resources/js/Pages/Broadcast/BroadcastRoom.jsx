import React, { useEffect, useState } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';

const BroadcastRoom = () => {
  const [fileNames, setFileNames] = useState([]);
  useEffect(() => {
    <Editor selectedFiles={ fileNames } />
  } , [fileNames]);

  return (
    <div className='all-space'>
      <div style={{ display: 'flex' }}>
        <FileTree fileNames={ fileNames } setFileNames={ setFileNames } />
        <div style={{ flex: 1 }}>
          <Editor selectedFiles={ fileNames } />
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
