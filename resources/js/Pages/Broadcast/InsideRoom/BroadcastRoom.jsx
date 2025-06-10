import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import FileTree from './FolderTree/FileTree';
import AudioStreamer from './Header/AudioStreamer';
import Editor from './Editor';
import TerminalComponent from './TerminalComponent';
import CommentList from './Comment/CommentList';
import CommentForm from './Comment/CommentForm';
import Pusher from 'pusher-js';
import Header from './Header/Header'; 
import './css/Editor.css';
import { useAppData } from '.././Contexts/AppDataContext';

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

const BroadcastRoom = ({ }) => {
  const [fileNames, setFileNames] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const pusherComments = usePusherComments();

  const [isMicOn, setMicOn] = useState(false);
  const [isBroadcasting, setBroadcasting] = useState(false);
  const [isSharing, setSharing] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showAlert, setShowAlert] = useState(false); // Alertの表示状態を管理

  const toggleMic = () => setMicOn(!isMicOn);
  const toggleBroadcast = () => setBroadcasting(!isBroadcasting);
  const toggleShare = () => setSharing(!isSharing);
  const { fileAndContents, updateFileContents, comments, addComment } = useAppData();
  
  const BroadcastRoom = () => {
    const { treeData } = useAppData();
    const socketRef = useRef(null);
  
    useEffect(() => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN &&
        treeData
      ) {
        socketRef.current.send(
          JSON.stringify({
            type: 'update_tree',
            data: treeData,
          })
        );
      }
    }, [treeData]);
  
    return <div className="broadcast-room">{/* your components here */}</div>;
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

      {showAlert && (
        <ConfirmationAlert
          message="配信を終了しますか？"
          onConfirm={() => {
            setShowAlert(false);
            // ナビゲーションを続行するロジックをここに追加
          }}
          onCancel={() => setShowAlert(false)}
        />
      )}

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
