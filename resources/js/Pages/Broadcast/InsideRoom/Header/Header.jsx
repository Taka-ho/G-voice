import React from 'react';
import '../css/Header.css';

const Header = ({ isMicOn, toggleMic, isBroadcasting, toggleBroadcast, isSharing, toggleShare }) => {
  const handleEndBroadcast = () => {
    if (window.confirm('配信を終了しますか？')) {
      fetch('/api/broadcast/down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      })
        .then((response) => response.json())
        .catch((error) => {
          console.error('Error:', error);
        });
    }
  };

  const handleToggleBroadcast = () => {
    if (isBroadcasting) {
      handleEndBroadcast();
    }
    toggleBroadcast();
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
        <button onClick={handleToggleBroadcast}>
          {isBroadcasting ? '配信 OFF' : '配信 ON'}
        </button>
      </div>
    </header>
  );
};

export default Header;
