import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
import Terminal from './Terminal';
import './css/Editor.css';
import './css/Tab.css';

const Editor = ({ selectedFiles }) => {
  const [fileNames, setFileNames] = useState([]);
  const [fileContents, setFileContents] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [codeOfUser, setCodeOfUser] = useState([]);
  const [terminalHeight, setTerminalHeight] = useState(260); // Adjust initial height as needed

  const prevProps = useRef();

  useEffect(() => {
    const setSelectedFileNames = () => {
      const files = [];
      const contents = [];
      if (0 < selectedFiles.length && selectedFiles.length < 2 && fileNames.length === 0) {
        files.push({ id: selectedFiles[0].id, name: selectedFiles[0].name });
        contents.push('');
        setFileNames(files);
        setFileContents(contents);
      }
      if (selectedFiles.length === 1) {
        setFileNames(prevFileNames => [{ id: selectedFiles[0].id, name: selectedFiles[0].name }]); // 新しいファイル名だけを設定
        contents.push('');
        setFileContents(contents);
      } else if (selectedFiles.length > 1 && prevProps.current) {
        const diff = selectedFiles.filter(file => !prevProps.current.includes(file));
        if (0 < diff.length) {
          const newFileNames = diff.map(file => ({ id: file.id, name: file.name }));
          setFileNames(prevFileNames => [...prevFileNames, ...newFileNames]);
          const newContents = Array(diff.length).fill(''); // 要素数を増やす
          setFileContents(prevContents => [...prevContents, ...newContents]);
        }
      }
      prevProps.current = selectedFiles;
    };

    setSelectedFileNames();
  }, [selectedFiles]);

  useEffect(() => {
    // selectedFileNameの変更を検知する
    handleHeight(); // selectedFileNameの変更を検知したら、handleHeightを呼び出す
  }, [selectedFileName]);

  const handleOnChange = (newValue, index) => {
    const updatedContents = fileContents.map((item, i) =>
      i === index ? { ...item, content: newValue } : item
    );

    setFileContents(updatedContents);
  };

  const updateState = (filesAndContents) => {
    const names = filesAndContents.map((item) => item.name);
    const contents = filesAndContents.map((item) => ({ content: item.contents }));

    setFileNames(names);
    setFileContents(contents);
  };

  const handleTabSelect = (selectedIndex) => {
    const fileName = fileNames[selectedIndex];
    setSelectedFileName(fileName);
  };

  const handleHeightChange = (height) => {
    setTerminalHeight(height);
  };

  const handleHeight = () => {
    if (selectedFileName === '') {
      return '90vh'; // 文字列で返す
    } else {
      return '100%'; // 100%に設定する
    }
  };

  return (
    <div className="app-container">
      <div className="editor-container" style={{ flex: 1, height: handleHeight() }}>
        <Tabs onSelect={handleTabSelect} style={{ width: '90%' }}>
          <TabList>
            {fileNames.map((fileName, index) => (
              <Tab key={fileName.id}>{fileName.name}</Tab>
            ))}
          </TabList>
          {fileContents.map((item, index) => (
            <TabPanel key={fileNames.id} value={fileNames[index]}>
              <div className="editor-space" style={{ height: `calc(100vh - ${terminalHeight}px - 10px)` }}>
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
    </div>
  );
};

export default Editor;