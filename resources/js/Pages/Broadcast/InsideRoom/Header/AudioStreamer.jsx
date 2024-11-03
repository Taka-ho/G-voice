import React, { useState } from 'react';

const AudioStreamer = () => {
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStreaming = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      setIsStreaming(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopStreaming = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  return (
    <div>
      <button onClick={isStreaming ? stopStreaming : startStreaming}>
        {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
      </button>
    </div>
  );
};

export default AudioStreamer;
