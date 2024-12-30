import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 9090;

app.use(cors()); // CORSを有効にする
app.use(express.json());
app.post('/file-in-container', async (req, res) => {
  console.log('リクエストを受信しました:', req.body); // リクエストボディをログに出力
  const { containerId } = req.body;
  
  if (!containerId) {
    return res.status(400).json({ error: 'containerIdが必要です' });
  }

  try {
    // コンテナ内のファイルリストを取得するコマンド
    const command = `echo '{"id": 1, "name": "root", "children": ['$(for file in /root/root/*; do if [[ -f "$file" ]]; then echo "{\"id\": $(date +%s%N | cut -b1-13), \"name\": \"$(basename "$file")\", \"content\": \"$(cat "$file" | sed 's/"/\\"/g')\"},"; else echo "{\"id\": $(date +%s%N | cut -b1-13), \"name\": \"$(basename "$file")\", \"content\": \"File does not exist\"},"; fi; done | sed '$ s/,$//')']}'`;
    console.log(`実行するコマンド: ${command}`); // コマンド内容を確認
    const baseURL = 'http://host.docker.internal:2375';

    const execCreateResponse = await axios.post(`${baseURL}/containers/${containerId}/exec`, {
      AttachStdout: true,
      AttachStderr: true,
      Cmd: command
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

  } catch (error) {
    console.error(`Docker APIエラー: ${error.message}`);
    res.status(500).json({ error: 'コンテナ情報の取得に失敗しました' });
  }
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
