import React, { useEffect, useState} from 'react';
import CommentForm from './Comment/CommentForm';
import CommentList from './Comment/CommentList';

const WebRTCVideoChat = () => {
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
        <div>
            <div className='comments'>
              <CommentList comments={ comments } updateComments={ setComments } />
              <CommentForm onAddComment={ addComment } />
            </div>
        </div>
    );
};

export default WebRTCVideoChat;
