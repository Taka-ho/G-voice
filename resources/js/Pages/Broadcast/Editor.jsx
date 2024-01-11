import React, { useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';

export default Editor = () => {
  return (    
    <Tabs>
      <TabList>
        {fileNames.map((fileName) => (
          <Tab key={fileName}>{fileName}</Tab>
        ))}
      </TabList>
      {fileContents.map((content, index) => (
        <TabPanel key={fileNames[index]}>
          <div className='editor-space'>
            <MonacoEditor
              language="plaintext"
              theme="visual studio"
              value={content}
            />
          </div>

        </TabPanel>
      ))}
    </Tabs>
  );
};
