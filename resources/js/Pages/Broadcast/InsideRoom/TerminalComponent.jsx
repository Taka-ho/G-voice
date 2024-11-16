import React, { useEffect, useState, useRef } from 'react';
import './css/Terminal.css';

const TerminalComponent = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [ws, setWs] = useState(null);
  const outputRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:7070');

    socket.onopen = () => {
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.output) {
        const formattedOutput = message.output.replace(/\r?\n/g, '\n');
        setOutput((prevOutput) => [...prevOutput, formattedOutput]);
      }
    };

    socket.onclose = () => {
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
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
      setOutput((prevOutput) => [...prevOutput, `> ${command}`]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput(''); // 入力欄をクリア
    }
  };

  return (
    <div className="terminal-container" ref={outputRef}>
      <div className="terminal-output">
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      <div>
        <span>{'>'} </span>
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
