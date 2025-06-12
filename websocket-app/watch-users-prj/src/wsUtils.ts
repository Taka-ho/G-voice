import axios from 'axios';
import { Buffer } from 'buffer';
import dotenv from 'dotenv'; // 環境変数を読み込むために追加

dotenv.config(); // process.env が利用可能であることを保証

// --- 型定義 (wsHandlers.ts からコピーして共有) ---
interface FileAndContentsMap {
  [key: string]: { id: number; name: string; content: string; path: string; };
}

// Docker Engine APIのベースURLとLaravel APIのベースURL
const DOCKER_BASE_URL = process.env.DOCKER_ENGINE_URL || 'http://host.docker.internal:2375';
const LARAVEL_API_BASE_URL = process.env.LARAVEL_API_URL || 'http://sail';

export const validateWebSocketMessage = (message: string) => {
  const parsed = JSON.parse(message);
  if (!parsed.token || !parsed.broadcastingRoomId || !parsed.type) {
    throw new Error('Missing authentication or message type.');
  }
  return parsed;
};

export const authenticateUser = async (token: string): Promise<string> => {
  const res = await axios.get(`${LARAVEL_API_BASE_URL}/api/auth-check`, { // LARAVEL_API_BASE_URL を使用
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user_id;
};

export const checkRoomOwnership = async (userId: string, roomId: string) => {
  const res = await axios.get(`${LARAVEL_API_BASE_URL}/api/room-owner-check/${roomId}`); // LARAVEL_API_BASE_URL を使用
  if (res.data.user_id !== userId) {
    throw new Error('You are not the owner of this room.');
  }
};

export const getContainerIdFromRedis = async (redis: any, roomId: string): Promise<string | null> => { // 戻り値を string | null に修正
  const key = `g_voice_database_broadcast:${roomId}`;
  const redisData = await redis.hgetall(key);
  // containerId が存在しない場合や null の場合も考慮
  return redisData.containerId || null; 
};

export const execCommand = async (containerId: string, cmd: string[]): Promise<string> => {
  try {
    const execRes = await axios.post(`${DOCKER_BASE_URL}/containers/${containerId}/exec`, { // DOCKER_BASE_URL を使用
      AttachStdout: true,
      AttachStderr: true,
      Cmd: cmd,
      Tty: false,
    });
    const execId = execRes.data.Id;

    const execStart = await axios.post(`${DOCKER_BASE_URL}/exec/${execId}/start`, { // DOCKER_BASE_URL を使用
      Detach: false,
      Tty: false,
    }, { responseType: 'stream' });

    return new Promise((resolve, reject) => {
      let stdout = '', stderr = '';
      execStart.data.on('data', (chunk: Buffer) => {
        const streamType = chunk[0];
        const size = chunk.readUInt32BE(4);
        const data = chunk.slice(8, 8 + size);
        
        // 修正: 三項演算子での代入ではなく、if/elseを使用
        if (streamType === 1) { // stdout
          stdout += data.toString('utf8');
        } else if (streamType === 2) { // stderr
          stderr += data.toString('utf8');
        }
      });
      execStart.data.on('end', async () => {
        try {
          const inspect = await axios.get(`${DOCKER_BASE_URL}/exec/${execId}/json`); // DOCKER_BASE_URL を使用
          // 終了コードが0以外の場合はreject
          return inspect.data.ExitCode === 0 ? resolve(stdout) : reject(new Error(stderr || stdout || `Command exited with code ${inspect.data.ExitCode}`));
        } catch (inspectError: any) { // エラー型を明示
            reject(new Error(`Exec inspection failed: ${(inspectError as Error).message}`));
        }
      });
      execStart.data.on('error', (err: Error) => reject(new Error(`Docker exec stream error: ${err.message}`))); // エラー型を明示
    });
  } catch (error: any) { // エラー型を明示
    console.error(`execCommand (${cmd.join(' ')}) failed:`, error.response?.data || error.message);
    throw new Error(`Docker exec command failed: ${error.message}`);
  }
};

export const moveFile = async (containerId: string, oldPath: string, newPath: string) => {
  await execCommand(containerId, ['mv', oldPath, newPath]);
};

/**
 * ファイルやディレクトリ名をサニタイズする (スペース除去)
 * @param {string} name - 元の名前
 * @returns {string} サニタイズされた名前
 */
const sanitizeName = (name: string): string => {
  return name.replace(/\s+/g, '');
};

export const getDockerFileTree = async (containerId: string, rootPath: string): Promise<any> => {
  console.log(`Fetching Docker file tree from ${rootPath} in container ${containerId}`);
  const tree: any = {
    id: Math.random(), 
    name: rootPath === '/' ? 'root' : sanitizeName(rootPath.split('/').pop() || ''), 
    path: rootPath,
    type: 'directory',
    children: []
  };

  try {
    const findOutput = await execCommand(containerId, ['find', rootPath, '-mindepth', '1', '-print']);
    const paths = findOutput.trim().split('\n').filter(p => p);

    const nodes = new Map<string, any>(); 
    nodes.set(rootPath, tree); 

    paths.sort(); // 親ディレクトリが先に処理されるようにソート

    for (const fullPath of paths) {
      const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
      const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);

      let isDirectory = false;
      try {
        await execCommand(containerId, ['test', '-d', fullPath]);
        isDirectory = true;
      } catch (e) {
        // test -d が失敗したらディレクトリではない
      }

      const node: any = {
        id: Math.random(), 
        name: sanitizeName(name), 
        path: fullPath,
        type: isDirectory ? 'directory' : 'file',
      };

      if (isDirectory) {
        node.children = [];
      } else {
        try {
          const fileContentBase64 = await execCommand(containerId, ['base64', fullPath]);
          node.content = Buffer.from(fileContentBase64.trim(), 'base64').toString('utf8');
        } catch (contentError: any) {
          console.warn(`Could not read content of file ${fullPath}:`, contentError.message);
          node.content = ''; 
        }
      }

      nodes.set(fullPath, node);

      if (nodes.has(parentPath)) {
        const parentNode = nodes.get(parentPath);
        if (parentNode.children) {
          parentNode.children.push(node);
        }
      } else {
        console.warn(`Parent path ${parentPath} not found for ${fullPath}. This might indicate an issue with find output or rootPath.`);
      }
    }
    return tree;
  } catch (error: any) {
    console.error('Failed to get Docker file tree:', error.message);
    throw error;
  }
};
