import React from 'react';
import '../css/Header.css';
import { useParams } from 'react-router-dom';

const Header = ({ isMicOn, toggleMic, isBroadcasting, toggleBroadcast, isSharing, toggleShare }) => {
  const { broadcastingRoomId } = useParams();
  const handleEndBroadcast = () => {
    return new Promise((resolve, reject) => {
      if (window.confirm('配信を終了しますか？')) {
        fetch('/broadcast/down', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          credentials: 'include',
          body: JSON.stringify({
            reason: 'unmount',
            timestamp: new Date().toISOString(),
            broadcastingRoomId: broadcastingRoomId,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then((data) => {
            console.log(data);
            console.log('Success:', data);
            // リダイレクトを実行
            window.location.href = '/dashboard'; // もしくはリダイレクト先のURLを指定
            resolve(); // 成功時にresolveを呼ぶ
          })
          .catch((error) => {
            console.error('Error:', error);
            reject(); // エラー時にrejectを呼ぶ
          });
      } else {
        resolve(); // キャンセルされた場合もresolveを呼ぶ
      }
    });
  };

  return (
    <header className="header">
      <div className='header-menu'>
        <button onClick={toggleMic}>
          {isMicOn ? 'マイク OFF' : 'マイク ON'}
        </button>
        <button onClick={toggleShare}>
          {isSharing ? '画面共有 STOP' : '画面共有 START'}
        </button>
        <button onClick={handleEndBroadcast}>
          {'配信 OFF'}
        </button>
      </div>
    </header>
  );
};

export default Header;
