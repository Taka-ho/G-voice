import express from 'express';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import axios from 'axios';
import sendTargetCacheObject from './sendUsersCodeAsCache.js';

const app = express();
const port = 3000;
const redis = new Redis({ host: 'redis', port: 6379 });
app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  ws.on('message', async (message) => {
    let parsedMessage;

    try {
      parsedMessage = JSON.parse(message);
    } catch (err) {
      ws.send(JSON.stringify({ status: 'error', message: 'Invalid JSON format.' }));
      ws.close();
      return;
    }

    const {
      broadcastingRoomId,
      treeData,
      fileAndContents,
      pathBeforeChange,
      pathAfterChange,
      pathOfDeleteFile,
      token // Laravel SanctumのBearerトークン
    } = parsedMessage;

    let userIdFromToken = null;

    try {
      const authResponse = await axios.get('http://sail/api/auth-check', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      userIdFromToken = authResponse.data.user_id;
    } catch (err) {
      ws.send(JSON.stringify({ status: 'error', message: 'Authentication failed.' }));
      ws.close();
      return;
    }

    try {
      const ownerResponse = await axios.get(`http://sail/api/room-owner-check/${broadcastingRoomId}`);
      const roomOwnerId = ownerResponse.data.user_id;

      if (roomOwnerId !== userIdFromToken) {
        ws.send(JSON.stringify({ status: 'error', message: 'You are not the owner of this room.' }));
        ws.close();
        return;
      }
    } catch (err) {
      ws.send(JSON.stringify({ status: 'error', message: 'Room owner check failed.' }));
      ws.close();
      return;
    }

    let containerId;
    try {
      const key = `g_voice_database_broadcast:${broadcastingRoomId}`;
      const redisData = await redis.hgetall(key);
      if (!redisData || !redisData.containerId) {
        ws.send(JSON.stringify({ status: "error", message: "RedisからcontainerIdが取得できませんでした。" }));
        return;
      }
      containerId = redisData.containerId;
    } catch (error) {
      ws.send(JSON.stringify({ status: "error", message: "Redisからの取得中にエラーが発生しました。" }));
      return;
    }

    // ================== Docker操作関数 ==================
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
        execStartResponse.data.on('end', () => resolve(output));
        execStartResponse.data.on('error', reject);
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

    // ================== ロジック系 ==================
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

    const sendToDB = async (cachedData) => {
      try {
        const response = await axios.post('http://sail/api/insertUsersCode', {
          data: cachedData
        });
        console.log('データがDBに挿入されました:', response.data);
      } catch (error) {
        console.error('DBへの送信中にエラーが発生しました:', error);
        ws.send(JSON.stringify({ status: "error", message: "DBへのデータ送信中にエラーが発生しました。" }));
      }
    };

    // ================== 実処理 ==================
    try {
      const cachedData = await sendTargetCacheObject.cacheData(containerId, treeData, fileAndContents);
      if (cachedData) {
        await sendToDB(cachedData);
      }
    } catch (error) {
      ws.send(JSON.stringify({ status: "error", message: "データのキャッシュ中にエラーが発生しました。" }));
    }

    applyContentsToTree(treeData);

    if (pathBeforeChange !== pathAfterChange) {
      await moveFile(containerId, pathBeforeChange, pathAfterChange);
    }

    await createOrUpdateStructure(treeData);

    ws.send(JSON.stringify({ success: true, parsedTreeData: treeData }));
  });
});
