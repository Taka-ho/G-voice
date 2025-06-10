import React, { useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppData } from '../Contexts/AppDataContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './css/Editor.css';
import './css/Tab.css';
import './css/CommentList.css';
import './css/Terminal.css';
import { useParams } from 'react-router-dom';

const Editor = ({ selectedFiles }) => {
  const { fileContents, setFileContents } = useAppData();
  const [selectedFileId, setSelectedFileId] = useState('');
  const [fileIds, setFileIds] = useState([]);
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
      });
    };

    window.addEventListener('beforeunload', notifySessionEnd);
    return () => {
      notifySessionEnd();
      window.removeEventListener('beforeunload', notifySessionEnd);
    };
  }, [broadcastingRoomId]);

  useEffect(() => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFileIds = selectedFiles.map(file => file.id);
    setFileIds(newFileIds);

    // 最初のファイルをデフォルトで選択
    if (!selectedFileId && newFileIds.length > 0) {
      setSelectedFileId(newFileIds[0]);
    }

    // fileContents にまだ登録されていないファイルを追加
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
  }, [selectedFiles]);

  const handleOnChange = (newValue, fileId) => {
    if (!fileId) return;
    setFileContents(prevContents => ({
      ...prevContents,
      [fileId]: {
        ...(prevContents[fileId] || {}),
        content: newValue,
      },
    }));
  };

  const handleTabSelect = (selectedIndex) => {
    const newSelectedId = fileIds[selectedIndex];
    setSelectedFileId(newSelectedId);
  };

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

export default Editor;
