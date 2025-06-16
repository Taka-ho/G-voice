import fs from 'fs';
import http from 'http';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';

const SOCKET_PATH = '/var/run/docker.sock';

export const validateWebSocketMessage = (message: string) => {
  const parsed = JSON.parse(message);
  if (!parsed.broadcastingRoomId || !parsed.type) {
    throw new Error('Missing authentication or message type.');
  }
  return parsed;
};

export const getContainerIdFromRedis = async (redis: any, broadcastingRoomId: string): Promise<string | null> => {
  const key = `g_voice_database_broadcast:${broadcastingRoomId}`;
  const redisData = await redis.hgetall(key);
  return redisData.containerId || null;
};

const dockerRequest = (options: http.RequestOptions, postData?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...options, socketPath: SOCKET_PATH }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

export const execCommand = async (containerId: string, cmd: string[]): Promise<string> => {
  const execCreate = await dockerRequest({
    path: `/containers/${containerId}/exec`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({
    AttachStdout: true,
    AttachStderr: true,
    Cmd: cmd,
    Tty: false,
  }));

  const execId = execCreate.Id;

  return new Promise((resolve, reject) => {
    const req = http.request({
      socketPath: SOCKET_PATH,
      path: `/exec/${execId}/start`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        let stdout = '';
        let cursor = 0;

        while (cursor + 8 <= buffer.length) {
          const streamType = buffer[cursor];
          const dataLength = buffer.readUInt32BE(cursor + 4);
          const dataStart = cursor + 8;
          const dataEnd = dataStart + dataLength;

          if (dataEnd > buffer.length) break;
          const payload = buffer.slice(dataStart, dataEnd).toString('utf8');
          if (streamType === 1) stdout += payload;
          cursor = dataEnd;
        }

        try {
          const inspect = await dockerRequest({
            path: `/exec/${execId}/json`,
            method: 'GET',
          });
          if (inspect.ExitCode === 0) resolve(stdout);
          else reject(new Error(stdout || `Command exited with code ${inspect.ExitCode}`));
        } catch (err: any) {
          reject(new Error(`Exec inspection failed: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ Detach: false, Tty: false }));
    req.end();
  });
};

export const sanitizeName = (name: string): string => name.replace(/\s+/g, '');

export const moveFile = async (containerId: string, oldPath: string, newPath: string) => {
  await execCommand(containerId, ['mv', oldPath, newPath]);
};

export const getDockerFileTree = async (containerId: string, rootPath: string): Promise<any> => {
  const tree: any = {
    id: uuidv4(),
    name: rootPath === '/' ? 'root' : rootPath.split('/').pop() || '',
    path: rootPath,
    type: 'directory',
    children: [],
  };

  try {
    const excluded = ['.ssh', '.bashrc', '.profile', '.bash_history'];

    const lsOutput = await execCommand(containerId, ['ls', rootPath]);
    const visibleItems = lsOutput.trim().split('\n').map(name => name.trim()).filter(Boolean).filter(name => !excluded.includes(name));
    const pathsToInclude = visibleItems.map(name => `${rootPath.replace(/\/$/, '')}/${name}`);

    const allPaths: string[] = [];
    for (const rawPath of pathsToInclude) {
      const sanitizedPath = rawPath.trim().replace(/\s+/g, '');
      try {
        const output = await execCommand(containerId, ['find', sanitizedPath]);
        allPaths.push(...output.trim().split('\n').map(p => p.trim()).filter(Boolean));
      } catch (err) {
        console.error(`Failed to find path: ${rawPath}`, err);
      }
    }

    const nodes = new Map<string, any>();
    nodes.set(rootPath, tree);
    allPaths.sort((a, b) => a.split('/').length - b.split('/').length);

    for (const fullPath of allPaths) {
      const name = fullPath.split('/').pop() || '';
      const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
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
      if (isDirectory) node.children = [];

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

export const getFileContent = async (containerId: string, filePath: string): Promise<string> => {
  try {
    const base64Content = await execCommand(containerId, ['base64', filePath]);
    return Buffer.from(base64Content.trim(), 'base64').toString('utf-8');
  } catch (err) {
    console.error(`Failed to read content from: ${filePath}`, err);
    return '';
  }
};
