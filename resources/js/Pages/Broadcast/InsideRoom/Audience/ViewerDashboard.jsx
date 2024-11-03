import CommentList from "../Comment/CommentList";
import CommentForm from "../Comment/CommentForm";

import { Head, useState, useEffect } from 'react';
import Pusher from 'pusher-js';

const usePusherComments = () => {
  const [pusherComments, setPusherComments] = useState([]);

  useEffect(() => {
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1'
    });

    const channel = pusher.subscribe('comment');
    channel.bind('SentComment', (newComment) => {
      setPusherComments(prevComments => [...prevComments, newComment]);
    });

    // Cleanup when component unmounts
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  return pusherComments;
};

const ViewerDashboard = ({ comments, addComment }) => {
    const pusherComments = usePusherComments();
  
    return (
      <div className='all-space'>
        <Head title="視聴部屋" />
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
            <CommentForm onAdd
            Comment={addComment} />
          </div>
        </div>
      </div>
    );
  };

  export default ViewerDashboard;
