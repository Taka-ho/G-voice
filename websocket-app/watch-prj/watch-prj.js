import express from 'express';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import axios from 'axios';
import sendTargetCacheObject from './sendUsersCodeAsCache.js';

const app = express();
const port = 3000;

// Redis クライアント作成（必要に応じてホスト・ポートを指定）
const redis = new Redis({ host: 'redis', port: 6379 }); // 例: new Redis({ host: 'redis', port: 6379 })

app.use(express.json());

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);
    const {
      broadcastingRoomId,
      treeData,
      fileAndContents,
      pathBeforeChange,
      pathAfterChange,
      pathOfDeleteFile
    } = parsedMessage;

    // ===== RedisからcontainerId取得（最優先で実行） =====
    let containerId;
    (async () => {
      const test = await redis.hgetall(`g_voice_database_broadcast:${broadcastingRoomId}`);
      console.log('Redisから取得:', test);
    })();
    try {
      const key = `g_voice_database_broadcast:${broadcastingRoomId}`;
      const redisData = await redis.hgetall(key);
      console.log('Redisから取得したデータ:', redisData);
      if (!redisData || !redisData.containerId) {
        console.log(JSON.stringify({ status: "error", message: "RedisからcontainerIdが取得できませんでした。" }));
        return;
      }

      containerId = redisData.containerId;
      console.log('取得した containerId:', containerId); // ✅ ログ出力（必ず出る）
    } catch (error) {
      console.error('Redisエラー:', error);
      ws.send(JSON.stringify({ status: "error", message: "Redisからデータ取得中にエラーが発生しました。" }));
      return;
    }

    // ================== 関数 ==================

    const execCommand = async (containerId, cmd) => {
      console.log('execCommand 内の containerId:', containerId); // ✅ ログ出力
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
      console.log('moveFile 内の containerId:', containerId); // ✅ ログ出力
      const command = ['mv', oldPath, newPath];
      return execCommand(containerId, command);
    };

    const createOrUpdateStructure = async (node, path = '/root') => {
      console.log('createOrUpdateStructure 内の containerId:', containerId); // ✅ ログ出力
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

    // ================== 実処理 ==================

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
        console.log(treeData);
        const response = await axios.post('http://sail/api/insertUsersCode', {
          data: cachedData
        });
        console.log('データがDBに挿入されました:', response.data);
      } catch (error) {
        console.error('DBへの送信中にエラーが発生しました:', error);
        ws.send(JSON.stringify({ status: "error", message: "DBへのデータ送信中にエラーが発生しました。" }));
      }
    };

    try {
      const cachedData = await sendTargetCacheObject.cacheData(containerId, treeData, fileAndContents);
      if (cachedData) {
        await sendToDB(cachedData);
      }
    } catch (error) {
      console.error('キャッシュ処理エラー:', error);
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
