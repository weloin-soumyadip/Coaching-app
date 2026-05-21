import { Router, type Request, type Response } from 'express';
import config from '../config/index.js';

const router = Router();

// GET /api/health — boot sanity check.
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

export default router;
