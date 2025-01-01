import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';
import sendTargetCacheObject from './sendUsersCodeAsCache';

const app = express();
const port = 3000;

app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

/**
 * Laravel APIから userId を取得
 * @param {string} containerId - DockerコンテナID
 * @returns {Promise<string>} - 取得したユーザーID
 */

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);
    const { treeData, containerId, fileAndContents, pathBeforeChange, pathAfterChange } = parsedMessage;
    try {
      // cacheDataを呼び出す
      const cachedData = await sendTargetCacheObject.cacheData(containerId, treeData, fileAndContents);
      if (cachedData) {
        sendToDB(cachedData);
      }
    } catch (error) {
        console.error('エラー:', error);
        ws.send(JSON.stringify({ status: "error", message: "データのキャッシュ中にエラーが発生しました。" }));
    }

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

    // キャッシュの有効期限が切れているものをLaravelアプリケーション側にPOSTさせる。
    const sendToDB = async (cachedData) => {
      try {
          const response = await axios.post('http://sail/api/insertUsersCode', {
              data: cachedData // 送信するデータ
          });
          console.log('データがDBに挿入されました:', response.data);
      } catch (error) {
          console.error('DBへの送信中にエラーが発生しました:', error);
          ws.send(JSON.stringify({ status: "error", message: "DBへのデータ送信中にエラーが発生しました。" }));
      }
    };

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

    const moveFile = async (containerId, oldPath, newPath) => {
      const command = ['mv', oldPath, newPath];
      return execCommand(containerId, command);
    };

    const createOrUpdateStructure = async (node, path = '/root') => {
      const sanitizedFileName = sanitizeName(node.name);
      const currentPath = `${path}/${sanitizedFileName}`;

      if (node.children) {
        await execCommand(containerId, ['mkdir', '-p', currentPath]);

        for (const child of node.children) {
          const childSanitizedFileName = sanitizeName(child.name);
          const childCurrentPath = `${currentPath}/${childSanitizedFileName}`;

          if (child.id in fileAndContents) {
            const oldChildName = sanitizeName(fileAndContents[child.id].name);
            const oldChildPath = `${currentPath}/${oldChildName}`;

            if (fileAndContents[child.id].name !== child.name) {
              await moveFile(containerId, oldChildPath, childCurrentPath);
            }
          }

          await createOrUpdateStructure(child, currentPath);
        }
      } else {
        const content = node.content || '';
        const finalPath = sanitizedFileName.includes('.') ? currentPath : `${currentPath}.txt`;
        await execCommand(containerId, ['bash', '-c', `echo "${content.replace(/"/g, '\\"')}" > ${finalPath}`]);
      }
    };

    applyContentsToTree(treeData);

    // リネーム処理
    if (pathBeforeChange !== pathAfterChange) {
      await moveFile(containerId, pathBeforeChange, pathAfterChange);
    }

    await createOrUpdateStructure(treeData);
    ws.send(JSON.stringify({ success: true, parsedTreeData: treeData }));
  });
});

app.listen(port, () => {
  console.log(`REST API server started on http://localhost:${port}`);
});

console.log('WebSocket server started on ws://localhost:8080');
