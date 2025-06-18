import React, { useEffect, useState, useRef } from 'react';
import '../css/Terminal.css';

const TerminalComponent = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [ws, setWs] = useState(null);
  const outputRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:7070');
    setWs(socket);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.output) {
        setOutput((prevOutput) => [...prevOutput, message.output.replace(/\r?\n/g, '\n')]);
      }
    };

    socket.onerror = (error) => {
      setOutput((prevOutput) => [...prevOutput, `[WebSocket error]: ${error.message}`]);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCommand = (command) => {
    if (ws && command.trim()) {
      ws.send(JSON.stringify({ command }));   // ←サーバー仕様に応じて修正
      setOutput((prevOutput) => [...prevOutput, `> ${command}`]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    }
  };

  return (
    <div className="terminal-container" style={{ height: '100%' }}>
      <div className="terminal-output" style={{ flex: 1 }}>
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#6cf', marginRight: 5 }}>{'>'}</span>
        <input
          type="text"
          placeholder='コマンドを入力してください'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
        />
      </div>
    </div>
  );
};

export default TerminalComponent;
