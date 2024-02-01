import React, { useCallback, useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
import ResultOfCode from './ResultOfCode';

import './css/Editor.css';
import './css/Tab.css';
const Editor = ({ selectedFiles }) => {
  const [fileNames, setFileNames] = useState([selectedFiles]);
  const [fileContents, setFileContents] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [answerOfUser, setAnswerOfUser] = useState([]);
  const [clickCount, setClickCount] = useState(0);

  const handleOnChange = (newValue, index) => {
    const updatedContents = fileContents.map((item, i) =>
      i === index ? { ...item, content: newValue } : item
    );

    setFileContents(updatedContents);
  };

  const updateState = (filesAndContents) => {
    const names = filesAndContents.map((item) => item.files);
    const contents = filesAndContents.map((item) => ({ content: item.contents }));

    setFileNames(names);
    setFileContents(contents);
  };

  const handleExecuteCode = useCallback(() => {
    // 実行ボタンを押す前にMonaco Editorの内容を保存
    const answer = {
      files: fileNames.map((item) => item),
      content: fileContents.map((item) => item.content),
    };
    console.log('selectedFiles:', selectedFiles);
    setAnswerOfUser(answer);
    setClickCount(clickCount + 1);
  }, [fileContents]);

  const handleTabSelect = (selectedIndex) => {
    const fileName = fileNames[selectedIndex];
    setSelectedFileName(fileName);
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
      <button className="execute" type="submit" onClick={handleExecuteCode}>
        実行する
      </button>    
        <Tabs onSelect={handleTabSelect}>
          <TabList>
            {fileNames.map((fileName, index) => (
              <Tab key={fileName}>{fileName}</Tab>
            ))}
          </TabList>
          {fileContents.map((item, index) => (
            <TabPanel key={item.fileName} value={selectedFileName}>
              <div className="editor-space">
                <MonacoEditor
                  language="javascript"
                  theme="vs"
                  value={item.content}
                  onChange={(newValue) => handleOnChange(newValue, index)}
                />
              </div>
            </TabPanel>
          ))}
        </Tabs>
        </div>
      <div style={{ flex: 1 }}>
        <ResultOfCode answerOfUser={answerOfUser} clickCountOfButton={clickCount} updateState={updateState}/>
      </div>
    </div>
  );
};

export default Editor;
