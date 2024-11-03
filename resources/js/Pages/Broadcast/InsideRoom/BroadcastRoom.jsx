import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AudioStreamer from './Header/AudioStreamer';
import FileTree from './FolderTree/FileTree';
import Editor from './Editor';
import TerminalComponent from './TerminalComponent';
import CommentList from './Comment/CommentList';
import CommentForm from './Comment/CommentForm';
import Pusher from 'pusher-js';
import Header from './Header/Header';  // 新しいHeaderコンポーネントをインポート
import './css/Editor.css';

const usePusherComments = () => {
  const [pusherComments, setComments] = useState([]);

  Pusher.log = function (message) {
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

const BroadcastRoom = ({ comments, addComment, updateFileContents, fileAndContents }) => {
  const [fileNames, setFileNames] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const pusherComments = usePusherComments();

  const [isMicOn, setMicOn] = useState(false);
  const [isBroadcasting, setBroadcasting] = useState(false);
  const [isSharing, setSharing] = useState(false);

  const toggleMic = () => setMicOn(!isMicOn);
  const toggleBroadcast = () => setBroadcasting(!isBroadcasting);
  const toggleShare = () => setSharing(!isSharing);

  const handleEndBroadcast = () => {
    if (window.confirm('Are you sure you want to end the broadcast?')) {
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
      <Head title="配信部屋〜" />
      <Header 
        isMicOn={isMicOn} 
        toggleMic={toggleMic} 
        isBroadcasting={isBroadcasting} 
        toggleBroadcast={toggleBroadcast} 
        isSharing={isSharing} 
        toggleShare={toggleShare} 
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <FileTree
          fileNames={fileNames}
          setFileNames={setFileNames}
          fileAndContents={fileAndContents}
          updateFileContents={updateFileContents}
        />
        <div className='Editor' style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Editor
            selectedFiles={fileNames}
            updateFileContents={updateFileContents}
            updateSelectedFileName={setSelectedFileName}
          />
          <TerminalComponent />
        </div>
        <div className="comment-section">
          <CommentList pusherComments={pusherComments} comments={comments} />
          <CommentForm onAddComment={addComment} />
        </div>
      </div>
    </div>
  );
};

export default BroadcastRoom;
