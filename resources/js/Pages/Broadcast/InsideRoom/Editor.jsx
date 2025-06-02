import React, { useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import EditorOfCode from '@monaco-editor/react';
import './css/Editor.css';
import './css/Tab.css';
import { useParams } from 'react-router-dom';

const Editor = ({ selectedFiles, updateFileContents }) => {
  const [fileNames, setFileNames] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileIds, setFileIds] = useState({});
  const { broadcastingRoomId } = useParams();
  
    useEffect(() => {
      const notifySessionEnd = () => {
        fetch('/broadcast/down', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          credentials: 'include',
          body: JSON.stringify({
            reason: 'unmount',
            timestamp: new Date().toISOString(),
            broadcastingRoomId: broadcastingRoomId,
          }),
        })
      };
  
      window.addEventListener('beforeunload', notifySessionEnd);
  
      return () => {
        notifySessionEnd();
        window.removeEventListener('beforeunload', notifySessionEnd);
      };
    }, [broadcastingRoomId]);
    

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
      
      // Save updated contents in localStorage
      const treeData = JSON.parse(localStorage.getItem('treeData') || '{}');
      if (treeData && treeData.children) {
        const fileToUpdate = treeData.children.find((file) => file.id === fileId);
        if (fileToUpdate) {
          fileToUpdate.content = newValue;
          localStorage.setItem('treeData', JSON.stringify(treeData));
        }
      }

      // Trigger a storage event to notify other components
      const storageEvent = new Event('storage');
      window.dispatchEvent(storageEvent);

      // Update file contents in parent component
      updateFileContents(fileId, fileName, newValue);

      return updatedContents;
    });
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedTree = JSON.parse(localStorage.getItem('treeData') || '{}');
  
      if (updatedTree && updatedTree.children) {
        const newFileNames = selectedFiles.map((file) => {
          const updatedFile = updatedTree.children.find((item) => item.id === file.id);
          return updatedFile ? updatedFile.name : file.name;
        });

        setFileNames(newFileNames);
      }
    };
  
    window.addEventListener('storage', handleStorageChange);
  
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedFiles]);

  // Handle tab select
  const handleTabSelect = (selectedIndex) => {
    setSelectedFileName(fileNames[selectedIndex]);
  };

  return (
    <div className="editor-container">
      <Tabs onSelect={handleTabSelect}>
        <TabList>
          {fileNames.map((fileName) => (
            <Tab key={fileName}>{fileName}</Tab>
          ))}
        </TabList>
        {fileNames.map((fileName) => (
          <TabPanel key={fileName}>
            <div className="editor-space">
              <EditorOfCode
                language="javascript"
                theme="vs"
                value={fileContents[fileName]}
                onChange={(value) => handleOnChange(value, fileName)}
              />
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default Editor;
