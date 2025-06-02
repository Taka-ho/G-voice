import React, { useEffect, useState, createContext, useContext } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import BroadcastRoom from './BroadcastRoom';
import ViewerDashboard from './Audience/ViewerDashboard';
import Pusher from 'pusher-js';

const AppDataContext = createContext(null);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === null) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

const ParentComponent = () => {
  const [comments, setComments] = useState([]);
  const [fileAndContents, setFileAndContents] = useState({});
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

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      endChannel.unbind_all();
      endChannel.unsubscribe();
    };

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
        setComments(prevComments => [...prevComments, data]);
      });
  };

  // データルーターを作成
  const router = createBrowserRouter([
    {
      path: "/broadcast/:broadcastingRoomId",
      element: <BroadcastRoom />,
    },
    {
      path: "/broadcast/stream/:broadcastingRoomId",
      element: <ViewerDashboard />,
    },
    // 他のルート定義を追加
  ]);

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
    <RouterProvider router={router}>
      <AppDataContext.Provider value={{ comments, addComment, fileAndContents, updateFileContents }}>
      </AppDataContext.Provider>
    </RouterProvider>
  );
};

export default ParentComponent;
