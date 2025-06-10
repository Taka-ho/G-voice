import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';

const app = express();
const port = 3030;

app.use(express.json());

const wss = new WebSocketServer({ port: 7070 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { command } = JSON.parse(message);

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
    } catch (error) {
      console.error('Redisエラー:', error);
      ws.send(JSON.stringify({ status: "error", message: "Redisからデータ取得中にエラーが発生しました。" }));
      return;
    }

    const baseURL = 'http://localhost:2375';
    console.log(`Executing command: ${command}`);    
    if (!command || !containerId) {
      ws.send(JSON.stringify({ output: 'Command and containerId are required' }));
      return;
    }
  
    try {
      // Dockerのコンテナにexecインスタンスを作成
      const execCreateResponse = await axios.post(`${baseURL}/containers/${containerId}/exec`, {
        Cmd: ['/bin/bash', '-c', command.replace(/(["'$`\\])/g,'\\$1')],
        AttachStdout: true,
        AttachStderr: true
      });            
  
      const execId = execCreateResponse.data.Id;
  
      // execインスタンスを開始して、結果を取得
      const execStartResponse = await axios.post(`${baseURL}/exec/${execId}/start`, {
        Detach: false,
        Tty: false
      }, {
        responseType: 'stream'
      });
  
      // 出力とエラーを取得
      let outputData = '';
      execStartResponse.data.setEncoding('utf8');
      execStartResponse.data.on('data', (chunk) => {
        outputData += chunk;
      });
  
      execStartResponse.data.on('end', () => {
        console.log(outputData);
        ws.send(JSON.stringify({ output: outputData || 'Command execution completed' }));
      });
  
    } catch (error) {
      ws.send(JSON.stringify({ output: `Error: ${error.message}` }));
    }
  });
});


app.listen(port, () => {
  console.log(`REST API server started on http://localhost:${port}`);
});

console.log('WebSocket server started on ws://localhost:7070');
