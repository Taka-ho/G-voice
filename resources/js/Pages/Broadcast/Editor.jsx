import React, { useCallback, useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
import ResultOfCode from './ResultOfCode';
import FileTree from './FileTree';

import './css/Editor.css';
import './css/Tab.css';
const Editor = ({ file }) => {
  const [fileNames, setFileNames] = useState([file]);
  const [directoryName, setDirectoryName] = useState([]);
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
    setAnswerOfUser(answer);
    setClickCount(clickCount + 1);
  }, [fileContents]);

  const handleTabSelect = (selectedIndex) => {
    const fileName = fileNames[selectedIndex];
    setSelectedFileName(fileName);
  };

  return (
    <div style={{ display: 'flex' }}>
      <FileTree />
      <div style={{ flex: 1 }}>
        <button className="execute" type="submit" onClick={handleExecuteCode}>
          実行する
        </button>
        <Tabs onSelect={handleTabSelect}>
          <TabList>
            {fileNames.map((fileName) => (
              <Tab key={fileName}>{fileName}</Tab>
            ))}
          </TabList>
            <TabPanel value={selectedFileName}>
              <div className="editor-space">
                <MonacoEditor
                  language="javascript"
                  theme="vs"
                  onChange={(newValue) => handleOnChange(newValue, index)}
                />
              </div>
            </TabPanel>
        </Tabs>
      </div>
      <div style={{ width: '50%' }}>
        <ResultOfCode answerOfUser={answerOfUser} clickCountOfButton={clickCount} updateState={updateState}/>
      </div>
    </div>
  );
};

export default Editor;
