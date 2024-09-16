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

    useEffect(() => {
        if (selectedFiles.length === 0) return;

        const newFileNames = selectedFiles.map(file => file.name);
        setFileNames(newFileNames);

        const newFileContents = {};
        const newFileIds = {};
        selectedFiles.forEach(file => {
            if (!fileContents[file.name]) {
                newFileContents[file.name] = file.content || '';
            }
            newFileIds[file.name] = file.id;
        });
        setFileContents(prevContents => ({ ...prevContents, ...newFileContents }));
        setFileIds(prevIds => ({ ...prevIds, ...newFileIds }));
    }, [selectedFiles]);

    const handleOnChange = (newValue, fileName) => {
        setFileContents(prevContents => {
            const updatedContents = {
                ...prevContents,
                [fileName]: newValue,
            };
            const fileId = fileIds[fileName];
            updateFileContents(fileId, fileName, newValue); // Update the parent component with file ID
            return updatedContents;
        });
    };

    useEffect(() => {
        if (selectedFileName) {
            const fileId = fileIds[selectedFileName];
            updateFileContents(fileId, selectedFileName, fileContents[selectedFileName]);
        }
    }, [fileContents, selectedFileName]);

    const handleTabSelect = (selectedIndex) => {
        setSelectedFileName(fileNames[selectedIndex]);
    };

    return (
        <div className="editor-container">
            <Tabs onSelect={handleTabSelect}>
                <TabList>
                    {fileNames.map((fileName, index) => (
                        <Tab key={fileName}>{fileName}</Tab>
                    ))}
                </TabList>
                {fileNames.map((fileName, index) => (
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
