import React, { useEffect, useState } from 'react';
import FileTree from './FolderTree/FileTree';
import Editor from './Editor';
import CommentForm from './Comment/CommentForm';
import CommentList from './Comment/CommentList';
import AudioStreamer from './Audio/AudioStreamer';
import { useParams } from 'react-router-dom'; // react-router-domからuseParamsをインポート

const BroadcastRoom = () => {
  const [fileNames, setFileNames] = useState([]);
  const [comments, setComments] = useState([]);
  
  // useParamsフックを使用してURLのパラメーターを取得
  const { id } = useParams();
  useEffect(() => {
    // URLのパラメーターを使用してAPIからデータを取得するなどの処理をここに記述
    fetch('/api/comments') // 例: /api/comments/:id のようなAPIエンドポイントを呼び出す
      .then((response) => response.json())
      .then((data) => setComments(data));

    // Pusherを使ったリアルタイムコメントのリッスンを追加
    window.Echo.channel('comment')
      .listen('.SentComment', (e) => {
        setComments(prevComments => [...prevComments, e.comment]);
      });
  }, [id]); // idパラメーターが変更されたときに再レンダリングするように指定

  const addComment = (newComment) => {
    // 新しいコメントオブジェクトにIDを追加する
    const commentWithId = { ...newComment, id };
  
    fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // IDを含めたコメントオブジェクトをJSON文字列に変換してリクエストのボディに設定する
      body: JSON.stringify(commentWithId),
    })
      .then((response) => response.json())
      .then((data) => {
        setComments([...comments, data]);
        fetch('/api/comments')
          .then((response) => response.json())
          .then((data) => setComments(data));
      });
  };  

  return (
    <div className='all-space'>
      <AudioStreamer />
      <div style={{ display: 'flex' }}>
        <FileTree fileNames={ fileNames } setFileNames={ setFileNames } />
        <div style={{ flex: 1 }}>
          <Editor selectedFiles={ fileNames } />
        </div>
        <div className='comments'>
          <CommentList comments={ comments } updateComments={ setComments } />
          <CommentForm onAddComment={ addComment } />
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
