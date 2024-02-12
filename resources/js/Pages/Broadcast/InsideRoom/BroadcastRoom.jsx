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

    // Pusherを使ったリアルタイムコメントのリッスンを追加
    window.Echo.channel('comment')
      .listen('.SentComment', (e) => {
        setComments(prevComments => [...prevComments, e.comment]);
      });
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
      .then((data) => {
        setComments([...comments, data]);
        fetch('/api/comments') // GETリクエストを実行してコメント一覧を更新
          .then((response) => response.json())
          .then((data) => setComments(data));
      });
  };

  return (
    <div className='all-space'>
      <div style={{ display: 'flex' }}>
        <FileTree fileNames={ fileNames } setFileNames={ setFileNames } />
        <div style={{ flex: 1 }}>
          <Editor selectedFiles={ fileNames } />
        </div>
        <div className='comments'>
          <CommentList comments={comments} updateComments={setComments} />
          <CommentForm onAddComment={addComment} />
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
