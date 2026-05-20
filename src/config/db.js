const mongoose = require('mongoose');
const config = require('./index');

// Connect to MongoDB and wire up connection event logging.
// Throws on missing URI or initial connection failure so the process
// exits cleanly under a supervisor (nodemon, PM2, Docker).
const connectDB = async () => {
  if (!config.mongoUri) {
    throw new Error('[mongo] MONGO_URI is not set. Add it to your .env file.');
  }

  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] connected to ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });
};

module.exports = connectDB;
