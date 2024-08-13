import React, { useRef, useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
import Terminal from './Terminal';
import './css/Editor.css';
import './css/Tab.css';

const Editor = ({ selectedFiles, updateFileContents }) => {
  const [fileNames, setFileNames] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');
  const [terminalHeight, setTerminalHeight] = useState(260);

  useEffect(() => {
    if (selectedFiles.length === 0) return;

    const newFileNames = selectedFiles.map(file => file.name);
    setFileNames(newFileNames);

    const newFileContents = {};
    selectedFiles.forEach(file => {
      if (!fileContents[file.name]) {
        newFileContents[file.name] = file.content || '';
      }
    });
    setFileContents(prevContents => ({ ...prevContents, ...newFileContents }));
  }, [selectedFiles]);

  const handleOnChange = (newValue, fileName) => {
    setFileContents(prevContents => {
      const updatedContents = {
        ...prevContents,
        [fileName]: newValue,
      };
      updateFileContents(fileName, newValue); // ファイル内容の更新時にコールバックを呼び出す
      return updatedContents;
    });
  };

  useEffect(() => {
    // fileContentsが変更されたときにコールバックを呼び出す
    if (selectedFileName) {
      updateFileContents(selectedFileName, fileContents[selectedFileName]);
    }
  }, [fileContents, selectedFileName, updateFileContents]);

  const handleTabSelect = (selectedIndex) => {
    setSelectedFileName(fileNames[selectedIndex]);
  };

  const handleHeight = () => {
    return selectedFileName === '' ? '90vh' : '100%';
  };

  return (
    <div className="app-container">
      <div className="editor-container" style={{ flex: 1, height: handleHeight() }}>
        <Tabs onSelect={handleTabSelect} style={{ width: '90%' }}>
          <TabList>
            {fileNames.map((fileName, index) => (
              <Tab key={fileName}>{fileName}</Tab>
            ))}
          </TabList>
          {fileNames.map((fileName, index) => (
            <TabPanel key={fileName}>
              <div className="editor-space" style={{ height: `calc(100vh - ${terminalHeight}px - 10px)` }}>
                <MonacoEditor
                  language="javascript"
                  theme="vs"
                  value={fileContents[fileName]}
                  onChange={(newValue) => handleOnChange(newValue, fileName)}
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
