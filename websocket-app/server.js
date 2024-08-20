import express from 'express';
import { WebSocketServer } from 'ws';
import axios from 'axios';

const app = express();
const port = 3000;

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    console.log(`Received message: ${message}`);

    const parsedMessage = JSON.parse(message);
    const { treeData, containerId, fileAndContents } = parsedMessage;

    const sanitizeName = (name) => {
      console.log("nameの値：" + name);
      const replacedName = name.replace(/\s+/g, '');
      console.log("replacedNameの値："+ replacedName);
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

      console.log('Applying contents to treeData...');
      applyContentsToTree(treeData);
      console.log('Contents applied to treeData:', JSON.stringify(treeData, null, 2));

      const createStructure = async (node, path = '/root') => {
        const sanitizedFileName = sanitizeName(node.name); // スペースを詰める
        const currentPath = `${path}/${sanitizedFileName}`;
        console.log(`Creating structure at path: ${currentPath}`);

        if (node.children) {
          console.log(`Creating directory: ${currentPath}`);
          await execCommand(containerId, ['mkdir', '-p', currentPath]);

          for (const child of node.children) {
            await createStructure(child, currentPath);
          }
        } else {
          const content = node.content || '';
          const finalPath = sanitizedFileName.includes('.') ? currentPath : `${currentPath}.txt`; // 拡張子がない場合は.txtを追加
          console.log(`Creating file: ${finalPath} with content: ${content}`);
          await execCommand(containerId, ['sh', '-c', `echo "${content.replace(/"/g, '\\"')}" > ${finalPath}`]);
        }
      };

      const execCommand = async (containerId, cmd) => {
        console.log(`Executing command: ${cmd.join(' ')}`);
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
            console.log(`Command output: ${output}`);
            resolve(output);
          });

          execStartResponse.data.on('error', (error) => {
            console.error(`Command error: ${error.message}`);
            reject(error);
          });
        });
      };

      console.log('Starting to create structure from root node...');
      await createStructure(treeData);

      console.log('Parsed Tree Data:', JSON.stringify(treeData, null, 2));

      // Get the container file structure
      const fileStructure = await execCommand(containerId, ['sh', '-c', 'ls -R /root']);
      console.log('Container file structure:\n', fileStructure);

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
