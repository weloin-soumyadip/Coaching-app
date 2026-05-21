import type { RequestHandler } from 'express';

// Catches rejected promises from async route handlers and forwards them to the
// central error handler via next(err). Express 5 propagates promise rejections
// natively, but the explicit wrap keeps controllers terser and the contract
// obvious.
const asyncHandler =
  <T extends RequestHandler>(fn: T): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
