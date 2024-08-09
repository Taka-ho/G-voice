import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './css/Terminal.css';

const TerminalComponent = () => {
  const terminalRef = useRef(null);

  useEffect(() => {
  
    // WebSocketクライアントの接続
    const socket = io('ws://localhost:6001'); // LaravelのWebSocketサーバーのURL
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('message', (data) => {
      term.write(data);
    });

  }, []);

  return (
      <div className='terminal-container'>
        <form>
          <textarea className='command-field' rows={1}></textarea>
        </form>
      </div>
  );
};

export default TerminalComponent;
