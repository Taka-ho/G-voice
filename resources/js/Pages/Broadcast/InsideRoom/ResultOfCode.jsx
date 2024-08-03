import React, { useEffect, memo, useState } from 'react';
import './css/ResultOfCode.css';

const ResultOfCode = memo(({ codeOfUser, updateState, fetchTrigger }) => {
  const [returnData, setReturnData] = useState([]);

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
    const handle = document.querySelector('.resize-handle');
    const showResult = document.getElementById('showResult');

    // 初期の高さを設定する
    const initialHeight = window.innerHeight * 0.7;
    showResult.style.height = `${initialHeight}px`;

    const startResize = (e) => {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    };

    const resize = (e) => {
      const newHeight = e.clientY - handle.offsetHeight / 2;
      const maxHeight = window.innerHeight * 0.9; // 10%以下には下げられないようにする
      const minHeight = window.innerHeight * 0.1; // 90%以上には上げられないようにする

      if (newHeight <= maxHeight && newHeight >= minHeight) {
        showResult.style.height = `${newHeight}px`;
      } else if (newHeight < minHeight) {
        showResult.style.height = `${minHeight}px`;
      } else {
        showResult.style.height = `${maxHeight}px`;
      }
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };

    handle.addEventListener('mousedown', startResize);

    return () => {
      handle.removeEventListener('mousedown', startResize);
    };
  }, []);

  return (
    <div>
      <div id="showResult" style={{ whiteSpace: 'pre-wrap' }}>
        <div className="resize-handle">
          <span></span>
        <div>
          {returnData.map((line, index) => (
            <React.Fragment key={index}>
              <br />
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
});

export default ResultOfCode;
