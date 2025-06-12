import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import cors from 'cors';
import sendTargetCacheObject from './sendUsersCodeAsCache';
import apiRouter from './routes';
import { setupWebSocketHandlers } from './wsHandlers';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const wsPort = parseInt(process.env.WS_PORT || '8080', 10);

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/', apiRouter);

// WebSocket Server
const wss = new WebSocketServer({ port: wsPort });
setupWebSocketHandlers(wss, redis);

// Start HTTP server
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

console.log('WebSocket server started on ws://localhost:8080');