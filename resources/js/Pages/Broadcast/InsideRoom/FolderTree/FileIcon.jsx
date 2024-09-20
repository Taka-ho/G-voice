// FileIcon.js
import React from 'react';
import 'devicon/devicon.min.css';
import '.././css/FileIcon.css';

const getFileIconClass = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase(); // 拡張子を小文字に変換
  switch (extension) {
    case 'js':
      return 'devicon-javascript-plain';
    case 'jsx':
    case 'tsx':
      return 'devicon-react-plain';
    case 'ts':
      return 'devicon-typescript-plain';
    case 'html':
      return 'devicon-html5-plain';
    case 'css':
      return 'devicon-css3-plain';
    case 'java':
      return 'devicon-java-plain';
    case 'py':
      return 'devicon-python-plain';
    case 'php':
      return 'devicon-php-plain';
    case 'rb':
      return 'devicon-ruby-plain';
    case 'go':
      return 'devicon-go-plain';
    case 'rs':
      return 'devicon-rust-plain';
    case 'swift':
      return 'devicon-swift-plain';
    case 'cs':
      return 'devicon-csharp-plain';
    case 'cpp':
      return 'devicon-cplusplus-plain';
    case 'kt':
      return 'devicon-kotlin-plain';
    case 'json':
      return 'devicon-json-plain';
    case 'xml':
      return 'devicon-xml-plain';
    case 'svg':
      return 'devicon-svg-plain';
    case 'yaml':
    case 'yml':
      return 'devicon-yaml-plain';
    case 'vue':
      return 'devicon-vuejs-plain';
    case 'ng':
    case 'angular':
      return 'devicon-angularjs-plain';
    case 'svelte':
      return 'devicon-svelte-plain';
    case 'graphql':
      return 'devicon-graphql-plain';
    case 'prisma':
      return 'devicon-prisma-plain';
    case 'md':
      return 'devicon-markdown-plain';
    case 'pdf':
      return 'devicon-pdf-plain';
    case 'doc':
    case 'docx':
      return 'devicon-word-plain';
    case 'xls':
    case 'xlsx':
      return 'devicon-excel-plain';
    case 'ppt':
    case 'pptx':
      return 'devicon-powerpoint-plain';
    case 'zip':
      return 'devicon-zip-plain';
    case 'rar':
      return 'devicon-rar-plain';
    case 'jpg':
    case 'jpeg':
      return 'devicon-jpg-plain';
    case 'png':
      return 'devicon-png-plain';
    case 'gif':
      return 'devicon-gif-plain';
    case 'ico':
      return 'devicon-ico-plain';
    case 'mp3':
      return 'devicon-mp3-plain';
    case 'mp4':
      return 'devicon-mp4-plain';
    case 'avi':
      return 'devicon-avi-plain';
    case 'env':
      return 'devicon-env-plain';
    case 'docker':
      return 'devicon-docker-plain';
    case 'git':
      return 'devicon-git-plain';
    case 'lock':
      return 'devicon-lock-plain';
    case 'babel':
      return 'devicon-babel-plain';
    case 'eslint':
      return 'devicon-eslint-plain';
    case 'prettier':
      return 'devicon-prettier-plain';
    case 'webpack':
      return 'devicon-webpack-plain';
    case 'txt':
      return 'devicon-txt-plain';
    case 'log':
      return 'devicon-log-plain';
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
