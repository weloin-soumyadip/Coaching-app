import express, { type Request, type Response } from 'express';
import cors from 'cors';

import config from './config/index.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.cors.origin.length ? config.cors.origin : '*',
    credentials: true,
  })
);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Hello from coaching app!',
  });
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// 404 + central error handler — must come LAST.
app.use(notFound);
app.use(errorHandler);

export default app;
