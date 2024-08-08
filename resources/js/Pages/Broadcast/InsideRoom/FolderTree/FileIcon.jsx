// FileIcon.js
import React from 'react';
import 'devicon/devicon.min.css';
import '.././css/FileIcon.css';
const getFileIconClass = (fileName) => {
  const extension = fileName.split('.').pop();
  switch (extension) {
    case 'js':
      return 'devicon-javascript-plain';
    case 'html':
      return 'devicon-html5-plain';
    case 'css':
      return 'devicon-css3-plain';
    case 'py':
      return 'devicon-python-plain';
    // 他の拡張子もここに追加
    default:
      return 'devicon-file';
  }
};

const FileIcon = ({ fileName, isFolder }) => {
  return (
    <i
      className={isFolder ? 'devicon-folder-opened' : getFileIconClass(fileName)}
      style={{ marginRight: '8px' }}
    ></i>
  );
};

export default FileIcon;
