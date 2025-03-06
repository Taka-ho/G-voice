import React, { useState, useEffect } from 'react';
import './css/RoomList.scss';

const InfiniteScroll = (props) => {
  const [data, setData] = useState([]); // 取得したデータ
  const [page, setPage] = useState(1); // 現在のページ番号
  const [loading, setLoading] = useState(false); // データを読み込んでいる最中かどうか

  useEffect(() => {
    // コンポーネントがマウントされたときにデータを読み込む
    loadData();

    // スクロールイベントのリスナーを追加
    window.addEventListener('scroll', handleScroll);
    return () => {
      // コンポーネントがアンマウントされたときにリスナーを削除
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
      // ページの最下部に達したら新しいデータを読み込む
      setPage(prevPage => prevPage + 1);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // RoomsListのAPIを叩く
      const response = await fetch(`http://localhost:80/api/roomsList?page=${page}`);

      // レスポンスが正常か確認
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const newData = await response.json();

      // 取得したデータをステートに追加
      setData(prevData => [...prevData, ...newData.data]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (roomId) => {
    window.location.href = `/broadcast/stream/${roomId}`;
  };

  return (
    <div className='mx-20'>
      {/* データがある場合 */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <div
              className='cursor-pointer mt-8 border rounded-lg bg-gray-100 p-4 shadow hover:bg-gray-200 transition'
              onClick={() => handleRoomClick(item.id)}
              key={item.id}
            >
              <h2 className='font-semibold text-lg'>{item.room_names}</h2>
              <p className='text-gray-600'>{item.room_explain}</p>
              <div className='mt-2 text-gray-500 text-sm'>
                <span>Container ID: {item.container_id}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // データがない場合
        <div className="text-center mt-10">
          <h2 className="text-gray-700">配信はありません。</h2>
        </div>
      )}
      {/* ローディングスピナーなどを表示する部分 */}
      {loading && <div className="text-center mt-4">Loading...</div>}
    </div>
  );
};

export default InfiniteScroll;
