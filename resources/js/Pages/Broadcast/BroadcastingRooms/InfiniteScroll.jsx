import React, { useState, useEffect, useRef } from 'react';
import './css/RoomList.scss';

const InfiniteScroll = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const noDataFetchCount = useRef(0);
  const [scrollDisabled, setScrollDisabled] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    loadData();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (page > 1 && !scrollDisabled) {
      loadData();
    }
  }, [page]);

  const handleScroll = () => {
    if (scrollDisabled || loading || !hasMore) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:80/api/roomsList?page=${page}`);
      if (!response.ok) throw new Error('Network response was not ok');

      const newData = await response.json();

      if (newData.data.length === 0) {
        noDataFetchCount.current += 1;

        if (noDataFetchCount.current >= 2) {
          setScrollDisabled(true);
          timeoutRef.current = setTimeout(() => {
            noDataFetchCount.current = 0;
            setScrollDisabled(false);
          }, 5 * 60 * 1000); // 5分間
        }
      } else {
        noDataFetchCount.current = 0; // 成功したのでリセット
      }

      setData(prevData => [...prevData, ...newData.data]);

      if (newData.data.length < 15) {
        setHasMore(false);
      }
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
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, index) => (
            <div
              className={`cursor-pointer border rounded-lg bg-gray-100 p-4 shadow hover:bg-gray-200 transition ${index >= data.length - 3 ? 'mb-[5%]' : ''}`}
              onClick={() => handleRoomClick(item.id)}
              key={item.id}
            >
              <h2 className='font-semibold text-lg'>{item.room_names}</h2>
              <p className='text-gray-600'>{item.room_explain}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-10">
          <h2 className="text-gray-700">配信はありません。</h2>
        </div>
      )}
      {loading && <div className="text-center mt-4">Loading...</div>}
      {!hasMore && <div className="text-center mt-4">これ以上配信部屋はありません。</div>}
      {scrollDisabled && <div className="text-center mt-4 text-red-500"></div>}
    </div>
  );
};

export default InfiniteScroll;
