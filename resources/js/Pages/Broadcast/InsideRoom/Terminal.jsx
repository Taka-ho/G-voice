import React, { useState } from 'react';
import axios from 'axios';
import './css/Terminal.css';

const TerminalComponent = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');

  const executeCommand = async () => {
    try {
      const response = await axios.post('/api/execute-command', { command });
      setOutput(response.data.output);
    } catch (error) {
      setOutput(error.response.data.error || 'An error occurred');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 新しく追加した行
      executeCommand();
    }
  };

  return (
    <div className="terminal-menu">
      <pre><h1>{output}</h1></pre>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter command"
        style={{ width: '95%' }}
      />
      <button onClick={executeCommand}>実行</button>
    </div>
  );
};

export default TerminalComponent;
