import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import FileTree from './FolderTree/FileTree';
import EditorWithExternalTerminal from './EditorWithExternalTerminal';
import AudioStreamer from './Header/AudioStreamer';
import Editor from './Editor';
import TerminalComponent from './Terminal/TerminalComponent';
import CommentList from './Comment/CommentList';
import CommentForm from './Comment/CommentForm';
import Pusher from 'pusher-js';
import Header from './Header/Header';
import './css/Editor.css';
import { useAppData } from '../Contexts/AppDataContext';
import { useParams } from 'react-router-dom';

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

const BroadcastRoom = () => {
  const [fileNames, setFileNames] = useState([]);
  const pusherComments = usePusherComments();

  const [isMicOn, setMicOn] = useState(false);
  const [isBroadcasting, setBroadcasting] = useState(false);
  const [isSharing, setSharing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { setBroadcastingRoomId } = useAppData();

  const toggleMic = () => setMicOn(!isMicOn);
  const toggleBroadcast = () => setBroadcasting(!isBroadcasting);
  const toggleShare = () => setSharing(!isSharing);

  const {
    fileAndContents,
    updateFileContents,
    comments,
    addComment,
    treeData,
  } = useAppData();

  const { broadcastingRoomId } = useParams();
  const socketRef = useRef(null);

  useEffect(() => {
    if (broadcastingRoomId) {
      setBroadcastingRoomId(broadcastingRoomId);
    }
  }, [broadcastingRoomId]);

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

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const navType = performance.getEntriesByType('navigation')[0]?.type;
      if (navType === 'reload') return;

      navigator.sendBeacon(
        '/broadcast/down',
        new Blob(
          [JSON.stringify({
            reason: 'unload',
            timestamp: new Date().toISOString(),
            broadcastingRoomId,
          })],
          { type: 'application/json' }
        )
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [broadcastingRoomId]);

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
          }}
          onCancel={() => setShowAlert(false)}
        />
      )}

      <div style={{ display: 'flex' }}>
        <FileTree
          fileNames={fileNames}
          setFileNames={setFileNames}
          fileAndContents={fileAndContents}
          updateFileContents={updateFileContents}
        />
        <div className="editor-terminal-container" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          height: '100%'
        }}>
          <EditorWithExternalTerminal selectedFiles={fileNames} />
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
