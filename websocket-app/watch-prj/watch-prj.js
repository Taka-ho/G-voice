import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

// グローバル変数で userId を保持
let userId = null;

/**
 * Laravel APIから userId を取得
 * @param {string} containerId - DockerコンテナID
 * @returns {Promise<string>} - 取得したユーザーID
 */
const getUserId = async (containerId) => {
  if (!userId) {
    try {
      const response = await axios.get(`http://sail/api/searchUserId/${containerId}`);
      userId = response.data.userId; // Laravelの期待されるレスポンス形式: { "userId": "value" }
      console.log(`User ID fetched: ${userId}`);
    } catch (error) {
      console.error(`Error fetching userId: ${error.message}`);
      throw new Error('Unable to fetch userId from Laravel API');
    }
  }
  return userId;
};

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

    try {
      // 初回のみ userId を取得
      const fetchedUserId = await getUserId(containerId);
      console.log(`Using User ID: ${fetchedUserId}`);

      applyContentsToTree(treeData);

      // リネーム処理
      if (pathBeforeChange !== pathAfterChange) {
        await moveFile(containerId, pathBeforeChange, pathAfterChange);
      }

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
