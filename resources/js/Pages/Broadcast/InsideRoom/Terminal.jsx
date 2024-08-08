import React, { useEffect, memo, useState, useRef } from 'react';
import './css/Terminal.css';

const Terminal = memo(({ codeOfUser, updateState, fetchTrigger, onHeightChange }) => {
  const [returnData, setReturnData] = useState([]);
  const handleRef = useRef(null);
  const showResultRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [initialY, setInitialY] = useState(0);
  const [currentY, setCurrentY] = useState(200); // Initial height

  useEffect(() => {
    let isMounted = true;

    const postAPI = async () => {
      if (fetchTrigger) {
        try {
          const treeData = localStorage.getItem("treeData");
          const triggerFilePath = localStorage.getItem("triggerFilePath");
          const response = await fetch('/api/broadcast/runCode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ codeOfUser, treeData, triggerFilePath }),
          });

          if (response.ok) {
            const data = await response.json();
            if (isMounted) {
              setReturnData(data[0]);
              updateState(data[1]);
            }
          } else {
            console.log('data:', await response.json());
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    const processUserAnswer = async () => {
      await postAPI();
    };

    processUserAnswer();
    return () => {
      isMounted = false;
    };
  }, [, , codeOfUser]);

  useEffect(() => {
    const handle = handleRef.current;
    const showResult = showResultRef.current;

    const dragStart = (e) => {
      setInitialY(e.clientY - currentY);
      setIsDragging(true);
    };

    const dragEnd = (e) => {
      setIsDragging(false);
      onHeightChange(currentY); // Notify parent component of the new height
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        const newY = e.clientY - initialY;
        if (newY > 100 && newY < window.innerHeight - 100) {
          setCurrentY(newY);
        }
      }
    };

    handle.addEventListener('mousedown', dragStart);
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('mousemove', drag);

    return () => {
      handle.removeEventListener('mousedown', dragStart);
      window.removeEventListener('mouseup', dragEnd);
      window.removeEventListener('mousemove', drag);
    };
  }, [isDragging, initialY, currentY, onHeightChange]);

  return (
    <div className="terminal-result" ref={showResultRef} style={{ height: `${currentY}px` }}>
      <div className="resize-handle" ref={handleRef} />
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {returnData.map((line, index) => (
          <React.Fragment key={index}>
            <br />
            {line}
            <br />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

export default Terminal;
