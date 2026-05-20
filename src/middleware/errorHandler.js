const config = require('../config');

// Centralized async-aware error handler. Must be registered LAST in app.js.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const payload = {
    status: 'error',
    message: err.message || 'Internal Server Error',
  };

  // Include stack trace in development for easier debugging.
  if (config.env === 'development' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
