// client.js
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('message', (data) => {
  console.log('Received message:', data);
});

socket.emit('message', 'Hello from the client!');
