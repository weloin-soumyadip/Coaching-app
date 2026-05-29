import type { ErrorRequestHandler } from 'express';
import config from '../config/index.js';
import logger from '../lib/logger.js';
import ApiError from '../utils/ApiError.js';
import { EMAIL_CONFLICT_BODY } from '../lib/auth/emailUniqueness.js';

// Mongo duplicate-key on the `email` unique index — the race-window companion
// to `assertEmailAvailable`. Detected by code + keyPattern so unrelated unique
// errors (e.g. CoachingCenter.slug) fall through to the default branch.
function isEmailDuplicateKeyError(err: unknown): boolean {
  const e = err as { code?: unknown; keyPattern?: Record<string, unknown> };
  return e.code === 11000 && e.keyPattern?.email === 1;
}

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

  // An ApiError can pin its own response body when the public shape is fixed
  // by spec (e.g. the generic email-conflict response). Honor it verbatim so
  // nothing else in this handler can accidentally leak details.
  if (err instanceof ApiError && err.body) {
    res.status(statusCode).json(err.body);
    return;
  }

  // Race-window duplicate on the role collections. The raw Mongo error names
  // the collection (i.e. the role), so it MUST be reshaped here before
  // anything reaches the client.
  if (isEmailDuplicateKeyError(err)) {
    res.status(409).json(EMAIL_CONFLICT_BODY);
    return;
  }

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
