import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import ApiError from '../utils/ApiError.js';

type Source = 'body' | 'query' | 'params';

// Validate `req[source]` against a Zod schema. On success the parsed
// (sanitised + coerced) value replaces the original so downstream handlers
// see only the validated shape.
//
// Express 5 made `req.query` a getter-only property — direct reassignment
// throws. We mutate the underlying object in place for query/params (both
// configured the same way) and reassign for body (still writable).
export const validate =
  (schema: ZodType, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => `${i.path.length ? i.path.join('.') : source}: ${i.message}`)
        .join('; ');
      return next(new ApiError(400, detail));
    }

    if (source === 'body') {
      (req as Request & { body: unknown }).body = result.data;
    } else {
      // In-place mutation for query / params (Express 5 getters).
      const target = req[source] as Record<string, unknown>;
      for (const k of Object.keys(target)) delete target[k];
      Object.assign(target, result.data as Record<string, unknown>);
    }
    next();
  };

export default validate;
