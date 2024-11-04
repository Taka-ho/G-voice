import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
const port = 3000;

app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

// 既存のWebSocketハンドラ（ファイルやフォルダを作成するもの）
wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);
    const { treeData, containerId, fileAndContents, pathBeforeChange, pathAfterChange } = parsedMessage;

    const sanitizeName = (name) => name.replace(/\s+/g, '');

    const applyContentsToTree = (node) => {
      node.name = sanitizeName(node.name);
      if (fileAndContents[node.id]) {
        fileAndContents[node.id].name = sanitizeName(fileAndContents[node.id].name);
        node.content = fileAndContents[node.id].content;
      }
      if (node.children) {
        node.children.forEach(child => applyContentsToTree(child));
      }
    };

    // execCommand関数の定義
    const execCommand = async (containerId, cmd) => {
      const baseURL = 'http://host.docker.internal:2375';
      const execCreateResponse = await axios.post(`${baseURL}/containers/${containerId}/exec`, {
        AttachStdout: true,
        AttachStderr: true,
        Cmd: cmd
      });

      const execId = execCreateResponse.data.Id;

      const execStartResponse = await axios.post(`${baseURL}/exec/${execId}/start`, {
        Detach: false,
        Tty: false
      }, {
        responseType: 'stream'
      });

      let output = '';
      execStartResponse.data.on('data', (data) => {
        output += data.toString();
      });

      return new Promise((resolve, reject) => {
        execStartResponse.data.on('end', () => {
          resolve(output);
        });

        execStartResponse.data.on('error', (error) => {
          console.error(`Command error: ${error.message}`);
          reject(error);
        });
      });
    };

    // moveFile関数の定義
    const moveFile = async (containerId, oldPath, newPath) => {
      const command = ['mv', oldPath, newPath]; // mvコマンドと引数
      return execCommand(containerId, command);
    };

    try {
      applyContentsToTree(treeData);

      // pathBeforeChangeとpathAfterChangeが異なる場合
      if (parsedMessage.pathBeforeChange !== parsedMessage.pathAfterChange) {
        await moveFile(containerId, parsedMessage.pathBeforeChange, parsedMessage.pathAfterChange);
      }

      const createOrUpdateStructure = async (node, path = '/root') => {
        const sanitizedFileName = sanitizeName(node.name);
        const currentPath = `${path}/${sanitizedFileName}`;

        // ディレクトリを作成または更新
        if (node.children) {
          // 親ディレクトリの作成
          await execCommand(containerId, ['mkdir', '-p', currentPath]);

          for (const child of node.children) {
            const childSanitizedFileName = sanitizeName(child.name);
            const childCurrentPath = `${currentPath}/${childSanitizedFileName}`;

            // 名前変更と新規作成の処理
            if (child.id in fileAndContents) {
              const oldChildName = sanitizeName(fileAndContents[child.id].name);
              const oldChildPath = `${currentPath}/${oldChildName}`;

              if (fileAndContents[child.id].name !== child.name) {
                // 名前が変更されている場合
                await execCommand(containerId, ['mv', oldChildPath, childCurrentPath]);
              }
            } else {
              // 新しいファイルの場合
              const content = child.content || '';
              const finalPath = childSanitizedFileName.includes('.') ? childCurrentPath : `${childCurrentPath}.txt`;
              await execCommand(containerId, ['sh', '-c', `echo "${content.replace(/"/g, '\\"')}" > ${finalPath}`]);
            }

            // 再帰的に子ノードを処理
            await createOrUpdateStructure(child, currentPath);
          }
        } else {
          // ファイルを作成または更新
          const content = node.content || '';
          const finalPath = sanitizedFileName.includes('.') ? currentPath : `${currentPath}.txt`;

          await execCommand(containerId, ['sh', '-c', `echo "${content.replace(/"/g, '\\"')}" > ${finalPath}`]);
        }
      };

      await createOrUpdateStructure(treeData);
      ws.send(JSON.stringify({ success: true, parsedTreeData: treeData }));
    } catch (error) {
      console.error(`Error processing message: ${error.message}`);
      ws.send(JSON.stringify({ success: false, error: error.message }));
    }
  });
});

app.listen(port, () => {
  console.log(`REST API server started on http://localhost:${port}`);
});

console.log('WebSocket server started on ws://localhost:8080');
