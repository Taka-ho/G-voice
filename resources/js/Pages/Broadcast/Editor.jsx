import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
import ResultOfCode from './ResultOfCode';
import _ from 'lodash';

import './css/Editor.css';
import './css/Tab.css';
const Editor = ({ selectedFiles }) => {
  const [fileNames, setFileNames] = useState([]);
  const [fileContents, setFileContents] = useState(['']);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [answerOfUser, setAnswerOfUser] = useState([]);

  const prevProps = useRef();

  useEffect(() => {
    const setSelectedFileNames = () => {
      const files = [];
      if (0 < selectedFiles.length && selectedFiles.length < 2 && fileNames.length === 0) {
        files.push(selectedFiles[0].name);
        setFileNames(files);
      }
      if (selectedFiles.length === 1) {
        setFileNames(prevFileNames => [selectedFiles[0].name]); // 新しいファイル名だけを設定
      } else if (selectedFiles.length > 1 && prevProps.current) {
        const diff = selectedFiles.filter(file => !prevProps.current.includes(file));
        if (diff.length > 0) {
          const newFileNames = diff.map(file => file.name);
          setFileNames(prevFileNames => [...prevFileNames, ...newFileNames]);
        }
      }
      prevProps.current = selectedFiles;
    };

    setSelectedFileNames();
  }, [selectedFiles]);

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
  }, [fileContents]);

  const handleTabSelect = (selectedIndex) => {
    const fileName = fileNames[selectedIndex];
    setSelectedFileName(fileName);
  };

  console.log(fileNames);
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
        <ResultOfCode answerOfUser={answerOfUser} updateState={updateState}/>
      </div>
    </div>
  );
};

export default Editor;
