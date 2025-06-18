// src/server.ts
import express from 'express';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import cors from 'cors';
import fsOperationRouter from './fsOperation';
import { setupWebSocketHandlers } from './wsHandlers';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const wsPort = parseInt(process.env.WS_PORT || '8080', 10);

// Redis クライアント
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});
app.locals.redis = redis;

// CORS 設定（本番環境ではオリジンを制限）
app.use(cors({
  origin: true, // 必要に応じて 'http://localhost:5173' 等へ
  credentials: true,
}));

// Body パーサー
app.use(express.json());

// ルーター設定
app.use('/api/fs-operation', fsOperationRouter);

// ✅ テスト用GETエンドポイント（疎通確認）
app.get('/api/fs-operation/ping', (_req, res) => {
  res.json({ message: 'fs-operation alive' });
});

// WebSocketサーバー起動
const wss = new WebSocketServer({ port: wsPort });
setupWebSocketHandlers(wss, redis);

// HTTPサーバー起動
app.listen(port, '0.0.0.0', () => {
  console.log(`Express server listening on http://localhost:${port}`);
  console.log(`WebSocket server started on ws://localhost:${wsPort}`);
});
