import React, { useEffect } from 'react';
import InfiniteScroll from './InfiniteScroll';
import './css/RoomList.scss';

const RoomsList = ({ auth }) => {

  return (
    <div className="flex flex-col items-left ml-5">
      {!auth.user && (
        <div className="flex space-x-4 mt-4">
          <a href="/login" className="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded px-4 py-2">
            ログイン
          </a>
          <a href="/register" className="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded px-4 py-2">
            新規登録
          </a>
        </div>
      )}
      <div className="flex space-x-4 mt-4">
          <a href="/login" className="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded px-4 py-2">
            ログイン
          </a>
          <a href="/register" className="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded px-4 py-2">
            新規登録
          </a>
        </div>
      <InfiniteScroll />
    </div>
  );
};

export default RoomsList;
