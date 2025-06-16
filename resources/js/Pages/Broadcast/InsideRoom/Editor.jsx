import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppData } from '../Contexts/AppDataContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './css/Editor.css';
import './css/Tab.css';
import './css/CommentList.css';
import './css/Terminal.css';

const EditorComponents = ({ selectedFiles }) => {
  const { fileContents, setFileContents, treeData } = useAppData();
  const [selectedFileId, setSelectedFileId] = useState('');
  const [fileIds, setFileIds] = useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);

  useEffect(() => {
    console.log('Current Files:', currentFiles);
  }, [currentFiles]);
  

  useEffect(() => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFileIds = selectedFiles.map(file => file.id);
    setFileIds(newFileIds);

    setFileContents(prevContents => {
      const updated = { ...prevContents };
      selectedFiles.forEach(file => {
        if (!(file.id in updated)) {
          updated[file.id] = {
            id: file.id,
            name: file.name,
            path: file.path,
            content: file.content ?? '',
          };
        }
      });
      return updated;
    });

    setCurrentFiles(selectedFiles);

    if (!selectedFileId && newFileIds.length > 0) {
      setSelectedFileId(newFileIds[0]);
    }
  }, [selectedFiles,]);

  useEffect(() => {
    if (!treeData || currentFiles.length === 0) return;

    const findNodeById = (node, id) => {
      if (!node) return null;
      if (node.id === id) return node;
      if (Array.isArray(node.children)) {
        for (let child of node.children) {
          const found = findNodeById(child, id);
          if (found) return found;
        }
      }
      return null;
    };

    const updated = currentFiles.map(file => {
      const updatedNode = findNodeById(treeData, file.id);
      return updatedNode ? {
        ...file,
        name: updatedNode.name,
        path: updatedNode.path,
      } : file;
    });

    setCurrentFiles(updated);
  }, [treeData, selectedFiles]);

  const handleOnChange = useCallback((newValue, fileId) => {
    if (!fileId) return;
    setFileContents(prevContents => ({
      ...prevContents,
      [fileId]: {
        ...(prevContents[fileId] || {}),
        content: newValue,
      },
    }));
  }, [setFileContents]);

  const handleTabSelect = (selectedIndex) => {
    const newSelectedId = fileIds[selectedIndex];
    setSelectedFileId(newSelectedId);
  };

  if (
    !currentFiles ||
    currentFiles.length === 0 ||
    !selectedFileId ||
    !fileContents[selectedFileId]
  ) {
    return <div className="editor-container">Loading...</div>;
  }

  return (
    <div className="editor-container">
      <Tabs
        onSelect={handleTabSelect}
        selectedIndex={fileIds.indexOf(selectedFileId)}
      >
        <TabList>
          {currentFiles.map(file => (
            <Tab key={file.id}>{file.name}</Tab>
          ))}
        </TabList>
        {currentFiles.map(file => (
          <TabPanel key={file.id}>
            <div className="editor-space">
              <MonacoEditor
                value={fileContents[file.id]?.content ?? ''}
                onChange={(value) => handleOnChange(value, file.id)}
                language="javascript"
                options={{ fontSize: 14 }}
              />
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

const Editor = React.memo(EditorComponents);
export default Editor;
