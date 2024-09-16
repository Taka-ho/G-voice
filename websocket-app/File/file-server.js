import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(express.json()); // JSONパーサーを追加

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {

    const parsedMessage = JSON.parse(message);
    const { treeData, containerId, fileAndContents } = parsedMessage;

    const sanitizeName = (name) => {
      const replacedName = name.replace(/\s+/g, '');
      return name.replace(/\s+/g, ''); // スペースを詰める
    };

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

    try {
      const baseURL = 'http://host.docker.internal:2375';

      applyContentsToTree(treeData);

      const createStructure = async (node, path = '/root') => {
        const sanitizedFileName = sanitizeName(node.name); // スペースを詰める
        const currentPath = `${path}/${sanitizedFileName}`;

        if (node.children) {
          await execCommand(containerId, ['mkdir', '-p', currentPath]);

          for (const child of node.children) {
            await createStructure(child, currentPath);
          }
        } else {
          const content = node.content || '';
          const finalPath = sanitizedFileName.includes('.') ? currentPath : `${currentPath}.txt`; // 拡張子がない場合は.txtを追加
          await execCommand(containerId, ['sh', '-c', `echo "${content.replace(/"/g, '\\"')}" > ${finalPath}`]);
        }
      };

      const execCommand = async (containerId, cmd) => {
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

      await createStructure(treeData);

      // Get the container file structure
      const fileStructure = await execCommand(containerId, ['sh', '-c', 'ls -R /root']);

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
