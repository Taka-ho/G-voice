import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import BroadcastRoom from './BroadcastRoom';
import ViewerDashboard from './Audience/ViewerDashboard';
import Pusher from 'pusher-js';
import { useAppData } from '../Contexts/AppDataContext';

const AllBroadcasting = () => {
  const { setComments } = useAppData();

  useEffect(() => {
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
    });

    const commentChannel = pusher.subscribe('comment');
    commentChannel.bind('SentComment', (newComment) => {
      setComments(prev => [...prev, newComment]);
    });

    const endChannel = pusher.subscribe('broadcast');
    endChannel.bind('EndBroadcast', () => {
      window.location.href = '/';
    });

    return () => {
      commentChannel.unbind_all();
      commentChannel.unsubscribe();
      endChannel.unbind_all();
      endChannel.unsubscribe();
    };
  }, [setComments]);

  const router = createBrowserRouter([
    {
      path: '/broadcast/:broadcastingRoomId',
      element: <BroadcastRoom />, // 編集不要
    },
    {
      path: '/broadcast/stream/:broadcastingRoomId',
      element: <ViewerDashboard />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default AllBroadcasting;
