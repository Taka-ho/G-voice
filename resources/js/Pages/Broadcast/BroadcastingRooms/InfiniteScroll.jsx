import React, { useState, useEffect } from 'react';
import './css/RoomList.scss';
import { ColorRing } from 'react-loader-spinner'

const InfiniteScroll = () => {
  const [data, setData] = useState([]); // 取得したデータ
  const [page, setPage] = useState(1); // 現在のページ番号
  const [loading, setLoading] = useState(false); // データを読み込んでいる最中かどうか
  const [lastPage, setLastPage] = useState(null); // 最終ページ番号

  useEffect(() => {
    // スクロールイベントのリスナーを追加
    window.addEventListener('scroll', handleScroll);
    return () => {
      // コンポーネントがアンマウントされたときにリスナーを削除
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!lastPage || page <= lastPage) {
      loadData(); // ページが変更され、まだ最終ページに到達していないときに新しいデータを読み込む
    }
  }, [page]);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
      // ページの最下部に達したら新しいデータを読み込む
      setPage(prevPage => prevPage + 1);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const response = await fetch(`/api/broadcasting?page=${page}`);
    const newData = await response.json();

    // 取得したデータをステートに追加
    setData(prevData => [...prevData, ...newData.data]);

    // 最終ページ番号を設定
    setLastPage(newData.last_page);

    setLoading(false);
  };

  const handleRoomClick = (roomId) => {
    window.location.href = `/broadcast/stream/${roomId}`;
  };

  return (
    <div className='mx-20'>
      {/* データを表示する部分 */}
      {data.map((item, index) => (
        <div className='cursor-pointer mt-8 border rounded-full bg-gray' onClick={() => handleRoomClick(item.id)} key={item.id}>
          <div className='p-3' style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <h1 style={{ marginRight: '5px' }}>{item.room_names}</h1>
          </div>
          <p className='text-center p-6'>{item.room_explain}</p>
        </div>
      ))}
      {loading && (
        <div className="loading-animation">
          <div className="color-ring-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
            <ColorRing
              visible={true}
              height="80"
              width="80"
              ariaLabel="color-ring-loading"
              wrapperStyle={{}}
              wrapperClass="color-ring-wrapper"
              colors={['gray', '#333', '#1144', '#333', 'black']}
            />
          </div>
        </div>
      )}
    </div>
  );
  
};

export default InfiniteScroll;
