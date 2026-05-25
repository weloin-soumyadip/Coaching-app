// Load env FIRST so all subsequent imports see process.env values.
// MUST be the very first import — ESM hoists all imports, but side-effect
// imports still run in source order, and dotenv/config sets process.env
// before any consumer module evaluates.
import 'dotenv/config';

import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';
import connectDB from './config/db.js';
import { connectRedis, disconnectRedis } from './lib/redis.js';
import logger from './lib/logger.js';

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await connectRedis();
    const server = app.listen(config.port, () => {
      logger.info({ port: config.port }, 'server listening');
    });

    // Graceful shutdown — close HTTP listener then Mongo + Redis. Lets
    // in-flight requests finish and ensures lifecycle events fire.
    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
      logger.info({ signal }, 'shutdown signal received');
      server.close(async () => {
        await Promise.allSettled([mongoose.disconnect(), disconnectRedis()]);
        process.exit(0);
      });
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    logger.fatal({ err }, 'failed to start');
    process.exit(1);
  }
};

void start();
