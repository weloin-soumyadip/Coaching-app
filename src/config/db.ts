import mongoose from 'mongoose';
import config from './index.js';

// Connect to MongoDB and wire up connection event logging.
// Throws on missing URI or initial connection failure so the process
// exits cleanly under a supervisor (PM2, Docker).
const connectDB = async (): Promise<void> => {
  if (!config.mongoUri) {
    throw new Error('[mongo] MONGO_URI is not set. Add it to your .env file.');
  }

  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] connected to ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err: Error) => {
    console.error('[mongo] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });
};

export default connectDB;
