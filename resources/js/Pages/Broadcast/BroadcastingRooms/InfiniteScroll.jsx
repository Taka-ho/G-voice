import React, { useState, useEffect } from 'react';

const InfiniteScroll = () => {
  const [data, setData] = useState([]); // 取得したデータ
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

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
      // ページの最下部に達したら新しいデータを読み込む
      setPage(prevPage => prevPage + 1);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // バックエンドからデータを取得
      const response = await fetch(`your_backend_url?page=${page}`);
      const newData = await response.json();

      // 取得したデータをステートに追加
      setData(prevData => [...prevData, ...newData]);
    } catch (error) {
      console.error('データの取得に失敗しました', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* データを表示する部分 */}
      {data.map(item => (
        <div key={item.id}>{/* データを表示するコンポーネントの中身 */}</div>
      ))}

      {/* ローディングスピナーなどを表示する部分 */}
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default InfiniteScroll;
