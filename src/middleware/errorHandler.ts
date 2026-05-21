import type { ErrorRequestHandler } from 'express';
import config from '../config/index.js';

// Centralized async-aware error handler. Must be registered LAST in app.ts.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const e = err as { statusCode?: unknown; message?: string; stack?: string };

  const statusCode =
    typeof e.statusCode === 'number' && Number.isInteger(e.statusCode) ? e.statusCode : 500;

  const payload: { status: 'error'; message: string; stack?: string } = {
    status: 'error',
    message: e.message ?? 'Internal Server Error',
  };

  // Include stack trace in development for easier debugging.
  if (config.env === 'development' && e.stack) {
    payload.stack = e.stack;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
