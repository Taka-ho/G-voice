import axios from 'axios';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';

const DOCKER_BASE_URL = process.env.DOCKER_ENGINE_URL || 'http://host.docker.internal:2375';

export const validateWebSocketMessage = (message: string) => {
  const parsed = JSON.parse(message);
  if (!parsed.broadcastingRoomId || !parsed.type) {
    throw new Error('Missing authentication or message type.');
  }
  return parsed;
};

export const getContainerIdFromRedis = async (redis: any, roomId: string): Promise<string | null> => {
  const key = `g_voice_database_broadcast:${roomId}`;
  const redisData = await redis.hgetall(key);
  return redisData.containerId || null;
};

export const execCommand = async (containerId: string, cmd: string[]): Promise<string> => {
  try {
    const execRes = await axios.post(`${DOCKER_BASE_URL}/containers/${containerId}/exec`, {
      AttachStdout: true,
      AttachStderr: true,
      Cmd: cmd,
      Tty: false,
    });
    const execId = execRes.data.Id;

    const execStart = await axios.post(`${DOCKER_BASE_URL}/exec/${execId}/start`, {
      Detach: false,
      Tty: false,
    }, { responseType: 'stream' });

    return new Promise((resolve, reject) => {
      let stdout = '', stderr = '';
      execStart.data.on('data', (chunk: Buffer) => {
        const streamType = chunk[0];
        const size = chunk.readUInt32BE(4);
        const data = chunk.slice(8, 8 + size);

        if (streamType === 1) stdout += data.toString('utf8');
        else if (streamType === 2) stderr += data.toString('utf8');
      });

      execStart.data.on('end', async () => {
        try {
          const inspect = await axios.get(`${DOCKER_BASE_URL}/exec/${execId}/json`);
          inspect.data.ExitCode === 0
            ? resolve(stdout)
            : reject(new Error(stderr || stdout || `Command exited with code ${inspect.data.ExitCode}`));
        } catch (inspectError: any) {
          reject(new Error(`Exec inspection failed: ${inspectError.message}`));
        }
      });

      execStart.data.on('error', (err: Error) => {
        reject(new Error(`Docker exec stream error: ${err.message}`));
      });
    });
  } catch (error: any) {
    console.error(`execCommand (${cmd.join(' ')}) failed:`, error.response?.data || error.message);
    throw new Error(`Docker exec command failed: ${error.message}`);
  }
};

export const sanitizeName = (name: string): string => {
  return name.replace(/\s+/g, '');
};

export const moveFile = async (containerId: string, oldPath: string, newPath: string) => {
  await execCommand(containerId, ['mv', oldPath, newPath]);
};

export const getDockerFileTree = async (containerId: string, rootPath: string): Promise<any> => {
  // console.log(`Fetching Docker file tree from ${rootPath} in container ${containerId}`);

  const tree: any = {
    id: uuidv4(),
    name: rootPath === '/' ? 'root' : rootPath.split('/').pop() || '',
    path: rootPath,
    type: 'directory',
    children: [],
  };

  try {
    const excluded = ['.ssh', '.bashrc', '.profile', '.bash_history'];

    // ls して除外フィルタをかける
    const lsOutput = await execCommand(containerId, ['ls', rootPath]);
    const visibleItems = lsOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter(name => !excluded.includes(name));

    const pathsToInclude = [];

    for (const name of visibleItems) {
      const fullPath = `${rootPath.replace(/\/$/, '')}/${name}`;
      pathsToInclude.push(fullPath);
    }

    // find で得られるすべてのパス（フィルタリング済み）
    const allPaths: string[] = [];

    for (const path of pathsToInclude) {
      try {
        const output = await execCommand(containerId, ['find', path]);
        allPaths.push(...output.trim().split('\n').filter(Boolean));
      } catch (err) {
        console.error(`Failed to find path: ${path}`, err);
      }
    }

    // 階層構造の構築
    const nodes = new Map<string, any>();
    nodes.set(rootPath, tree);

    allPaths.sort((a, b) => a.split('/').length - b.split('/').length);

    for (const fullPath of allPaths) {
      const name = fullPath.split('/').pop() || '';
      const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';

      // ディレクトリかどうかをチェック
      let isDirectory = false;
      try {
        await execCommand(containerId, ['test', '-d', fullPath]);
        isDirectory = true;
      } catch {
        isDirectory = false;
      }

      const node: any = {
        id: uuidv4(),
        name,
        path: fullPath,
        type: isDirectory ? 'directory' : 'file',
      };

      if (isDirectory) {
        node.children = [];
      } else {
        try {
          const base64Content = await execCommand(containerId, ['base64', fullPath]);
          node.content = Buffer.from(base64Content.trim(), 'base64').toString('utf-8');
        } catch {
          node.content = '';
        }
      }

      const parentNode = nodes.get(parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      }

      nodes.set(fullPath, node);
    }

    return tree;
  } catch (error: any) {
    console.error('Failed to get Docker file tree:', error.message);
    throw error;
  }
};
