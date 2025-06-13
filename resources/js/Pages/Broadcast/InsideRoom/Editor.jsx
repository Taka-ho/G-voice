import React, { useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppData } from '../Contexts/AppDataContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './css/Editor.css';
import './css/Tab.css';
import './css/CommentList.css';
import './css/Terminal.css';

const Editor = ({ selectedFiles }) => {
  const { fileContents, setFileContents } = useAppData();
  const [selectedFileId, setSelectedFileId] = useState('');
  const [fileIds, setFileIds] = useState([]);

  useEffect(() => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFileIds = selectedFiles.map(file => file.id);
    setFileIds(newFileIds);

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

    // 最初のファイルをデフォルトで選択（fileContents に追加した後）
    if (!selectedFileId && newFileIds.length > 0) {
      setSelectedFileId(newFileIds[0]);
    }
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
  console.log(fileContents);
  const handleTabSelect = (selectedIndex) => {
    const newSelectedId = fileIds[selectedIndex];
    setSelectedFileId(newSelectedId);
  };

  // ファイル内容がまだ読み込まれていない場合は null 表示
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

export default Editor;
