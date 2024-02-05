import React, { useEffect, useState } from 'react';
import FileTree from './FolderTree/FileTree';
import Editor from './Editor';
import CommentForm from './Comment/CommentForm';
import CommentList from './Comment/CommentList';

const BroadcastRoom = () => {
  const [fileNames, setFileNames] = useState([]);
  const [comments, setComments] = useState([]);

   useEffect(() => {
    fetch('/api/comments')
      .then((response) => response.json())
      .then((data) => setComments(data));
  }, []);

  const addComment = (newComment) => {
    fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newComment),
    })
      .then((response) => response.json())
      .then((data) => setComments([...comments, data]));
  };

  return (
    <div className='all-space'>
      <div style={{ display: 'flex' }}>
        <FileTree fileNames={ fileNames } setFileNames={ setFileNames } />
        <div style={{ flex: 1 }}>
          <Editor selectedFiles={ fileNames } />
        </div>
        <div className='comments'>
          <CommentForm onAddComment={addComment} />
          <CommentList comments={comments} />
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
