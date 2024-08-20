import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BroadcastRoom from './BroadcastRoom';
import ViewerDashboard from './ViewerDashboard';
import Pusher from 'pusher-js';

const ParentComponent = () => {
  const [comments, setComments] = useState([]);
  const [fileAndContents, setFileAndContents] = useState({}); // ファイル内容を格納するオブジェクト

  useEffect(() => {
    fetch('/api/comments')
      .then((response) => response.json())
      .then((data) => {
        setComments(data);
      });

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1'
    });

    const channel = pusher.subscribe('comment');
    channel.bind('SentComment', function (newComment) {
      setComments(prevComments => [...prevComments, newComment]);
    });

    const endChannel = pusher.subscribe('broadcast');
    endChannel.bind('EndBroadcast', function () {
      window.location.href = '/';
    });

  }, []);

  const addComment = (newComment) => {
    const commentWithId = { ...newComment };

    fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      credentials: 'include',
      body: JSON.stringify(commentWithId),
    })
      .then((response) => response.json())
      .then((data) => {
        setComments([...comments, data]);
        fetch('/api/comments')
          .then(response => response.json())
          .then(data => setComments(data));
      });
  };

  // ファイルコンテンツを更新する関数
  const updateFileContents = (fileId, fileName, newContent) => {
    setFileAndContents(prevContents => ({
      ...prevContents,
      [fileId]: {
        name: fileName,
        content: newContent
      }
    }));
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/broadcast/:id" element={
            <BroadcastRoom 
              comments={comments} 
              addComment={addComment} 
              updateFileContents={updateFileContents}
              fileAndContents={fileAndContents}
            />} 
          />
          <Route path="/broadcast/stream/:id" element={
            <ViewerDashboard 
              comments={comments} 
              addComment={addComment} 
            />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default ParentComponent;
