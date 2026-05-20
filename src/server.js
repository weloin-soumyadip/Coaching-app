// Load env FIRST so all subsequent requires see process.env values.
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`[server] listening on :${config.port} (${config.env})`);
    });

    // Graceful shutdown — close HTTP listener then Mongo. Lets in-flight
    // requests finish and ensures the 'disconnected' event fires.
    const shutdown = async (signal) => {
      console.log(`[server] received ${signal}, shutting down`);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
};

start();
