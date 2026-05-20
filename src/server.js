// Load env FIRST so all subsequent requires see process.env values.
require('dotenv').config();

const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`[server] listening on :${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
};

start();
