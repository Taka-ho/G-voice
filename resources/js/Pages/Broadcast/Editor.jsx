import React, { useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import MonacoEditor from 'react-monaco-editor';
export default function Editor() {
  const fileName = 'App.js';
  const fileContents = 'console.log("Hello World");';
  return (    
    <Tabs>
      <TabList>
          <Tab>{fileName}</Tab>
      </TabList>
        <TabPanel key={fileName}>
          <div className='editor-space'>
            <MonacoEditor
              language="plaintext"
              theme="visual studio"
              value={fileContents}
            />
          </div>
      </TabPanel>
    </Tabs>
  );
};
