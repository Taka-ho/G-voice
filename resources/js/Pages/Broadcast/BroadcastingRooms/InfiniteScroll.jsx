import React, { useState, useEffect } from 'react';
import './css/RoomList.scss';
const InfiniteScroll = (props) => {
  const [data, setData] = useState(props.broadcasting.data || []); // 取得したデータ
  const [page, setPage] = useState(1); // 現在のページ番号
  const [loading, setLoading] = useState(false); // データを読み込んでいる最中かどうか

  useEffect(() => {
    // スクロールイベントのリスナーを追加
    window.addEventListener('scroll', handleScroll);
    return () => {
      // コンポーネントがアンマウントされたときにリスナーを削除
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // ページが変更されたときにデータを読み込む関数を呼び出す
    loadData();
  }, [page]);
  console.log(props);
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
      // ページの最下部に達したら新しいデータを読み込む
      setPage(prevPage => prevPage + 1);
    }
  };
  console.log(props.broadcasting.data);
  const loadData = async () => {
    setLoading(true);
    const response = await fetch(`/?page=${page}`);
    const newData = await response.json();

    // 取得したデータをステートに追加
    setData(prevData => [...prevData, ...newData.broadcasting.data]);
  };

  return (
  <div className='mx-16'>
        {/* データを表示する部分 */}
        {data.map((item, index) => (
      <div className='cursor-pointer mt-8 border rounded-full bg-gray'>
        <div className='p-6 mx-3' style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }} key={item.id}>
          <h1 style={{ marginRight: '5px' }}>{props.broadcasting.data[index].room_names}</h1>
        </div>
        <p className='text-center'>{props.broadcasting.data[index].room_explain}</p>
      </div>
    ))}
      {/* ローディングスピナーなどを表示する部分 */}
  </div>
  );
  
  
};

export default InfiniteScroll;
