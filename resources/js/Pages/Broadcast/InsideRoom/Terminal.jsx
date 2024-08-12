import React, { useState } from 'react';
import axios from 'axios';

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

  return (
    <div className='terminal-menu'>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter command"
      />
      <button onClick={executeCommand}>Execute</button>
      <pre>{output}</pre>
    </div>
  );
};

export default TerminalComponent;
