import mongoose from 'mongoose';
import config from './index.js';
import logger from '../lib/logger.js';

// Connect to MongoDB and wire up connection event logging.
// Throws on missing URI or initial connection failure so the process
// exits cleanly under a supervisor (PM2, Docker).
const connectDB = async (): Promise<void> => {
  if (!config.mongoUri) {
    throw new Error('[mongo] MONGO_URI is not set. Add it to your .env file.');
  }

  await mongoose.connect(config.mongoUri);
  logger.info({ dbName: mongoose.connection.name }, 'mongo connected');

  mongoose.connection.on('error', (err: Error) => {
    logger.error({ err }, 'mongo connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('mongo disconnected');
  });
};

export default connectDB;
