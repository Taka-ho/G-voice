import React, { useEffect, memo, useState } from 'react';
import './css/ResultOfCode.css';

const ResultOfCode = memo(({ answerOfUser, clickCountOfButton, updateState }) => {
  const [returnData, setReturnData] = useState([]);

  useEffect(() => {
    let isMounted = true; // コンポーネントが unmount されているかどうかを示すフラグ

    const postAPI = async () => {
      // ... 非同期処理の中身 ...
      try {
        const response = await fetch('http://localhost:3030/api/ReturnResult', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answerOfUser),
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
    };

    const processUserAnswer = async () => {
      await postAPI();
    };

    processUserAnswer();

    // クリーンアップ関数
    return () => {
      isMounted = false; // コンポーネントが unmount されたらフラグを false にする
    };
  }, [answerOfUser, clickCountOfButton]);

  return (
    <div id="showResult" style={{ whiteSpace: 'pre-wrap' }}>
      <ul className="terminal-result-window">
        <li className="terminal-title">実行結果</li>
      </ul>
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
  );
});

export default ResultOfCode;
