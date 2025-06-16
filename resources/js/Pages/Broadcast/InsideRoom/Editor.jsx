import React, { useEffect, useState, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useAppData } from '../Contexts/AppDataContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './css/Editor.css';
import './css/Tab.css';
import './css/CommentList.css';
import './css/Terminal.css';

const EditorComponents = ({ selectedFiles }) => {
  const { fileContents, setFileContents, treeData, updateFileContents } = useAppData();
  const [selectedFileId, setSelectedFileId] = useState('');
  const [currentFiles, setCurrentFiles] = useState([]);

  // ファイル追加/削除時に現在のタブ一覧をIDで追従
  useEffect(() => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    // fileContentsも常にIDで管理
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

    setCurrentFiles(prevFiles => {
      // 既存のID順序と内容を維持しつつ、新規ファイルも末尾追加
      const ids = selectedFiles.map(f => f.id);
      const next = [];
      ids.forEach(id => {
        const existing = prevFiles.find(f => f.id === id);
        const sel = selectedFiles.find(f => f.id === id);
        next.push(existing ? { ...existing, ...sel } : sel);
      });
      return next;
    });

    // 新規追加時のみ最初のファイルを開く
    if (!selectedFileId && selectedFiles.length > 0) {
      setSelectedFileId(selectedFiles[0].id);
    } else if (
      selectedFileId &&
      !selectedFiles.some(file => file.id === selectedFileId)
    ) {
      // 現在選択中のファイルが削除された場合、先頭にフォーカス
      setSelectedFileId(selectedFiles[0]?.id || '');
    }
  }, [selectedFiles]);

  // ファイル名やpathがtreeDataで変更されたらcurrentFilesをIDで追従
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
      if (updatedNode) {
        // 常にファイル名・パスを同期
        updateFileContents(file.id, updatedNode.name, fileContents[file.id]?.content, updatedNode.path);
        return {
          ...file,
          name: updatedNode.name,
          path: updatedNode.path,
        };
      }
      return file;
    });

    setCurrentFiles(updated);
  }, [treeData]);

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

  const fileIds = currentFiles.map(f => f.id);

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
