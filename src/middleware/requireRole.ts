import type { RequestHandler } from 'express';
import type { UserType } from '../lib/auth/jwt.js';
import ApiError from '../utils/ApiError.js';

const requireRole =
  (...allowed: UserType[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(new ApiError(401, 'Not authenticated'));
    if (!allowed.includes(req.auth.type)) {
      return next(new ApiError(403, 'Forbidden'));
    }
    next();
  };

export default requireRole;
