import React, { useState, useEffect } from 'react';
import './css/RoomList.scss';
const InfiniteScroll = (props) => {
  const [data, setData] = useState(props.broadcasting.data || []); // 取得したデータ
  const [page, setPage] = useState(1); // 現在のページ番号
  const [loading, setLoading] = useState(false); // データを読み込んでいる最中かどうか

  useEffect(() => {
    // スクロールイベントのリスナーを追加
    window.addEventListener('scroll', handleScroll);
    loadData();
    return () => {
      // コンポーネントがアンマウントされたときにリスナーを削除
      window.removeEventListener('scroll', handleScroll);
    };
  }, [page]);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
      // ページの最下部に達したら新しいデータを読み込む
      setPage(prevPage => prevPage + 1);
    }
  };
  const loadData = async () => {
    setLoading(true);
    const response = await fetch(`/?page=${page}`);
    const newData = await response.json();

    // 取得したデータをステートに追加
    setData(prevData => [...prevData, ...newData.broadcasting.data]);
  };

  const handleRoomClick = (roomId) => {
    window.location.href = `/broadcast/stream/${roomId}`;
  };
  return (
    <div className='mx-20'>
        {/* データを表示する部分 */}
        {data.map((item, index) => (
          <div className='cursor-pointer mt-8 border rounded-full bg-gray' onClick={() => handleRoomClick(item.id)}>
          <div className='p-3' style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }} key={item.id}>
            <h1 style={{ marginRight: '5px' }}>{item.room_names}</h1>
          </div>
        <p className='text-center p-6'>{props.broadcasting.data[index].room_explain}</p>
      </div>
    ))}
      {/* ローディングスピナーなどを表示する部分 */}
  </div>
  );
  
  
};

export default InfiniteScroll;
