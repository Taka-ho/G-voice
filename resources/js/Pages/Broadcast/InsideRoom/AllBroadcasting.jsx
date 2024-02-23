import React, { useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CommentForm from './Comment/CommentForm';
import CommentList from './Comment/CommentList';
import AudioStreamer from './Audio/AudioStreamer';
import FileTree from './FolderTree/FileTree';
import Editor from './Editor';
import Pusher from 'pusher-js';

const ParentComponent = () => {
  const [comments, setComments] = useState([]);

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
      channel.bind('SentComment', function(newComment) {
        setComments(prevComments => [...prevComments, newComment]);
      });
      const endChannel = pusher.subscribe('broadcast');
      endChannel.bind('EndBroadcast', function() {
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
        console.log(document.querySelector('meta[name="csrf-token"]').content);
        setComments([...comments, data]);
        fetch('/api/comments')
          .then(response => response.json())
          .then(data => setComments(data));
      });
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/broadcast/:id" element={<BroadcastRoom comments={comments} addComment={addComment} />} />
          <Route path="/broadcast/stream/:id" element={<ViewerDashboard comments={comments} addComment={addComment} />} />
        </Routes>
      </div>
    </Router>
  );
};

//Pusherのコメントからコメントのオブジェクトをキャッチしてstateに格納するコンポーネント
const usePusherComments = () => {
  const [pusherComments, setComments] = useState([]);
  
  Pusher.log = function(message) {
    const startIndex = message.indexOf('"Event recd"');
    if (startIndex !== -1) {
      const jsonStartIndex = message.indexOf('{', startIndex);
      if (jsonStartIndex !== -1) {
        const jsonString = message.substring(jsonStartIndex);
        const jsonEndIndex = jsonString.lastIndexOf('}');
        const json = jsonString.substring(0, jsonEndIndex + 1);
        try {
          const eventData = JSON.parse(json);
          if (eventData.data && eventData.data.comment) {
            const comments = eventData.data.comment;
            setComments(comments);
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    }
  };

  return pusherComments;
};

const BroadcastRoom = ({ comments, addComment }) => {
  const [fileNames, setFileNames] = useState([]);
  const pusherComments = usePusherComments();
  const handleEndBroadcast = () => {
    if (window.confirm('本当に配信を終了しますか？')) {
      fetch('/api/broadcast/down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      })
      
        .then((response) => response.json())
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  };          
    return (
      <div className='all-space'>
        <AudioStreamer />
        <button onClick={handleEndBroadcast}>配信終了</button>
        <div style={{ display: 'flex' }}>
          <FileTree fileNames={ fileNames } setFileNames={ setFileNames } />
          <div style={{ flex: 1 }}>
            <Editor selectedFiles={ fileNames } />
          </div>
          <div>
            <CommentList pusherComments={pusherComments} comments={comments} />
            <CommentForm onAddComment={addComment} />
          </div>
        </div>
      </div>
    );

};

const ViewerDashboard = ({ comments, addComment }) => {
  const pusherComments = usePusherComments();

  return (
    <div>
      <CommentList pusherComments={pusherComments} comments={comments} />
      <CommentForm onAddComment={addComment} />
    </div>
  );
};

export default ParentComponent;
