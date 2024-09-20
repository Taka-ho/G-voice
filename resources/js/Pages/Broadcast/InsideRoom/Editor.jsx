import React, { useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
import './css/Editor.css';
import './css/Tab.css';

const Editor = ({ selectedFiles, updateFileContents }) => {
  const [fileNames, setFileNames] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileIds, setFileIds] = useState({});

  // Sync selected files with Editor
  useEffect(() => {
    if (selectedFiles.length === 0) return;

    const newFileNames = selectedFiles.map((file) => file.name);
    setFileNames(newFileNames);

    const newFileContents = {};
    const newFileIds = {};
    selectedFiles.forEach((file) => {
      if (!fileContents[file.name]) {
        newFileContents[file.name] = file.content || '';
      }
      newFileIds[file.name] = file.id;
    });
    setFileContents((prevContents) => ({ ...prevContents, ...newFileContents }));
    setFileIds((prevIds) => ({ ...prevIds, ...newFileIds }));
  }, [selectedFiles]);

  const handleOnChange = (newValue, fileName) => {
    setFileContents((prevContents) => {
      const updatedContents = {
        ...prevContents,
        [fileName]: newValue,
      };
      const fileId = fileIds[fileName];
      updateFileContents(fileId, fileName, newValue);
      return updatedContents;
    });
  };

  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage change detected');
      const updatedTree = JSON.parse(localStorage.getItem('treeData') || '{}');
      console.log('Updated tree:', updatedTree);
  
      if (updatedTree && updatedTree.children) {
        const newFileNames = selectedFiles.map((file) => {
          const updatedFile = updatedTree.children.find((item) => item.id === file.id);
          return updatedFile ? updatedFile.name : file.name;
        });
  
        console.log('New file names:', newFileNames);
        setFileNames(newFileNames);
      }
    };
  
    window.addEventListener('storage', handleStorageChange);
  
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedFiles]);

  useEffect(() => {
    if (selectedFileName) {
      const fileId = fileIds[selectedFileName];
      updateFileContents(fileId, selectedFileName, fileContents[selectedFileName]);
    }
  }, [fileContents, selectedFileName]);

  // Handle tab select
  const handleTabSelect = (selectedIndex) => {
    setSelectedFileName(fileNames[selectedIndex]);
  };

  return (
    <div className="editor-container" style={{ flex: 1 }}>
      <Tabs onSelect={handleTabSelect}>
        <TabList>
          {fileNames.map((fileName) => (
            <Tab key={fileName}>{fileName}</Tab>
          ))}
        </TabList>
        {fileNames.map((fileName) => (
          <TabPanel key={fileName}>
            <div className="editor-space">
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
  );
};

export default Editor;
