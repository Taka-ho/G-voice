import express from 'express';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import path from 'path';
import axios from 'axios';

const app = express();
const port = 3000;
const wss = new WebSocketServer({ port: 8080 });

app.use(express.json()); // JSON parser

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  // Listen for messages from the client
  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);
    const { treeData, containerId, fileAndContents } = parsedMessage;

    const watcher = chokidar.watch(baseDirectory, { ignored: /(^|[\/\\])\../, persistent: true });

    wss.on('connection', (ws) => {
      console.log('WebSocket connection established');
    
      ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message);
        const { treeData, containerId, fileAndContents } = parsedMessage;
    
        const watcher = chokidar.watch(baseDirectory, { ignored: /(^|[\/\\])\../, persistent: true });
    
        try {
          watcher
            .on('add', (filePath) => {
              const fileName = path.basename(filePath);
              ws.send(JSON.stringify({ type: 'add', fileName }));
            })
            .on('change', (filePath) => {
              const fileName = path.basename(filePath);
              ws.send(JSON.stringify({ type: 'change', fileName }));
            })
            .on('unlink', (filePath) => {
              const fileName = path.basename(filePath);
              ws.send(JSON.stringify({ type: 'remove', fileName }));
            });
        } catch (error) {
          console.error(`Error: ${error.message}`);
          ws.send(JSON.stringify({ success: false, error: error.message }));
        }
      });
    });    
  });
});

app.listen(port, () => {
  console.log(`REST API server started on http://localhost:${port}`);
});

console.log('WebSocket server started on ws://localhost:8080');

// Helper function to sanitize the file tree
function sanitizeTreeData(treeData, fileAndContents) {
  const sanitizeName = (name) => name.replace(/\s+/g, '');

  const applyContentsToTree = (node) => {
    node.name = sanitizeName(node.name);

    if (fileAndContents[node.id]) {
      fileAndContents[node.id].name = sanitizeName(fileAndContents[node.id].name);
      node.content = fileAndContents[node.id].content;
    }

    if (node.children) {
      node.children.forEach((child) => applyContentsToTree(child));
    }
  };

  applyContentsToTree(treeData);
  return treeData;
}
