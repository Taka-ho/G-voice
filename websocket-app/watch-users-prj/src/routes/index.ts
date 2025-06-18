// src/routes/index.ts
import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add more API routes here as needed

export default router;
