import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import BroadcastRoom from './BroadcastRoom';
import ViewerDashboard from './Audience/ViewerDashboard';
import Pusher from 'pusher-js';
import { useAppData } from '../Contexts/AppDataContext';

const AllBroadcasting = () => {
  // コンテキストからコメント関連を取得
  const { comments, addComment, setComments } = useAppData();

  useEffect(() => {
    // Pusherセットアップ
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
    });

    const channel = pusher.subscribe('comment');
    channel.bind('SentComment', (newComment) => {
      setComments(prev => [...prev, newComment]);
    });

    const endChannel = pusher.subscribe('broadcast');
    endChannel.bind('EndBroadcast', () => {
      window.location.href = '/';
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      endChannel.unbind_all();
      endChannel.unsubscribe();
    };
  }, [setComments]);

  // ルーター定義
  const router = createBrowserRouter([
    {
      path: '/broadcast/:broadcastingRoomId',
      element: <BroadcastRoom />,
    },
    {
      path: '/broadcast/stream/:broadcastingRoomId',
      element: <ViewerDashboard />,
    },
  ]);

  return (
    <RouterProvider router={router} />
  );
};

export default AllBroadcasting;
