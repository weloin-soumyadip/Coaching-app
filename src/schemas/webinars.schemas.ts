import { z } from 'zod';
import { objectIdSchema, paginationFields } from './common.js';

const STATUSES = ['scheduled', 'live', 'completed', 'cancelled'] as const;

// Create — teacher is taken from req.auth, never from the body.
export const webinarCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    scheduledAt: z.coerce.date(),
    durationMinutes: z.number().int().min(0).max(1440).optional(),
    thumbnail: z.string().url().optional(),
    joinUrl: z.string().url().optional(),
    status: z.enum(STATUSES).optional(),
  })
  .strict();

// Update — all fields optional; status togglable (e.g. cancel).
export const webinarUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    scheduledAt: z.coerce.date().optional(),
    durationMinutes: z.number().int().min(0).max(1440).optional(),
    thumbnail: z.string().url().optional(),
    joinUrl: z.string().url().optional(),
    status: z.enum(STATUSES).optional(),
  })
  .strict();

// Public list query — pagination + optional filters.
export const webinarListQuerySchema = z
  .object({
    ...paginationFields,
    teacher: objectIdSchema.optional(),
    status: z.enum(STATUSES).optional(),
    upcoming: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  })
  .strict();;

export type WebinarCreate = z.infer<typeof webinarCreateSchema>;
export type WebinarUpdate = z.infer<typeof webinarUpdateSchema>;
export type WebinarListQuery = z.infer<typeof webinarListQuerySchema>;
