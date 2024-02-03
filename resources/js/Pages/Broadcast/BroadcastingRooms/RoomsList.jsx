import React, { useState, useEffect } from 'react';

const RoomsList = () => {
  
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

export default RoomsList;
