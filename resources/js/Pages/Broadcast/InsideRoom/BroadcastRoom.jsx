import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AudioStreamer from './Audio/AudioStreamer';
import FileTree from './FolderTree/FileTree';
import Editor from './Editor';
import Terminal from './Terminal';
import CommentList from './Comment/CommentList';
import CommentForm from './Comment/CommentForm';
import Pusher from 'pusher-js';
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

const BroadcastRoom = ({ comments, addComment, containerId }) => {
    const [fileNames, setFileNames] = useState([]);
    const [fileContents, setFileContents] = useState([]);
    const [selectedFileName, setSelectedFileName] = useState('');
    const pusherComments = usePusherComments();
  
    // ファイルコンテンツを更新する関数
    const updateFileContents = (newContent) => {
      setFileContents(newContent);
    };
  
    // 選択されたファイル名を更新する関数
    const updateSelectedFileName = (newFileName) => {
      setSelectedFileName(newFileName);
    };
  
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
        <Head title="配信ルーム!!" />
        <button onClick={handleEndBroadcast} style={{textAlign:'left'}}>配信終了</button>
        <AudioStreamer />
        <div style={{ display: 'flex', flex: 1 }}>
          <FileTree 
            fileNames={fileNames}
            fileContents={setFileContents}
            setFileNames={setFileNames} 
            containerId={containerId} 
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Editor 
              selectedFiles={fileNames} 
              updateFileContents={updateFileContents} 
              updateSelectedFileName={updateSelectedFileName} 
            />
            <div className="terminal-container">
              <Terminal />
            </div>
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