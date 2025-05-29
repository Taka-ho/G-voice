import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import FileTree from './FolderTree/FileTree';
import AudioStreamer from './Header/AudioStreamer';
import Editor from './Editor';
import TerminalComponent from './TerminalComponent';
import CommentList from './Comment/CommentList';
import CommentForm from './Comment/CommentForm';
import Pusher from 'pusher-js';
import Header from './Header/Header'; 
import ConfirmationAlert from './Alert/ConfirmationAlert'; // 新しいコンポーネントをインポート
import UseNavigationConfirmation from './Alert/UseNavigationConfirmation';
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
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showAlert, setShowAlert] = useState(false); // Alertの表示状態を管理

  const toggleMic = () => setMicOn(!isMicOn);
  const toggleBroadcast = () => setBroadcasting(!isBroadcasting);
  const toggleShare = () => setSharing(!isSharing);

  // フォームがダーティな場合に確認を有効にする
  const shouldConfirm = isFormDirty;

  // 戻る（履歴移動）時にカスタムダイアログを表示
  UseNavigationConfirmation(shouldConfirm, setShowAlert);

  // リロードと戻るの検知
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isFormDirty) {
        const confirmationMessage = "変更が失われる可能性があります。配信を終了しますか？";
        event.returnValue = confirmationMessage; // Chrome用
        return confirmationMessage; // Firefox用
      }
    };

    const handlePopState = () => {
      if (isFormDirty) {
        setShowAlert(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState); // 履歴移動を検知

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState); // クリーンアップ
    };
  }, [isFormDirty]);

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
