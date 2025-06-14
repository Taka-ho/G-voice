import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppData } from '../Contexts/AppDataContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './css/Editor.css';
import './css/Tab.css';
import './css/CommentList.css';
import './css/Terminal.css';

const EditorComponents = ({ selectedFiles }) => {
  const { fileContents, setFileContents } = useAppData();
  const [selectedFileId, setSelectedFileId] = useState('');
  const [fileIds, setFileIds] = useState([]);

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

    if (!selectedFileId && newFileIds.length > 0) {
      setSelectedFileId(newFileIds[0]);
    }
  }, [selectedFiles]);

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
    !selectedFiles ||
    selectedFiles.length === 0 ||
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
          {selectedFiles.map(file => (
            <Tab key={file.id}>{file.name}</Tab>
          ))}
        </TabList>
        {selectedFiles.map(file => (
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
