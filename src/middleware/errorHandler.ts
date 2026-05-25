import type { ErrorRequestHandler } from 'express';
import config from '../config/index.js';
import logger from '../lib/logger.js';

// Centralized async-aware error handler. Must be registered LAST in app.ts.
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const e = err as { statusCode?: unknown; message?: string; stack?: string };

  const statusCode =
    typeof e.statusCode === 'number' && Number.isInteger(e.statusCode) ? e.statusCode : 500;

  const level = statusCode >= 500 ? 'error' : 'warn';
  logger[level](
    {
      err,
      statusCode,
      path: req.path,
      method: req.method,
      reqId: (req as { id?: string | number }).id,
    },
    'request errored'
  );

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
