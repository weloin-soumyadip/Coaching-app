// Load env FIRST so all subsequent imports see process.env values.
// MUST be the very first import — ESM hoists all imports, but side-effect
// imports still run in source order, and dotenv/config sets process.env
// before any consumer module evaluates.
import 'dotenv/config';

import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';
import connectDB from './config/db.js';

const start = async (): Promise<void> => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`[server] listening on :${config.port} (${config.env})`);
    });

    // Graceful shutdown — close HTTP listener then Mongo. Lets in-flight
    // requests finish and ensures the 'disconnected' event fires.
    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
      console.log(`[server] received ${signal}, shutting down`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    console.error('[server] failed to start:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
};

void start();
