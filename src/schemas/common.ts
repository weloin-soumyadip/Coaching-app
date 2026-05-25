import { z } from 'zod';

// Shared Zod primitives reused across role-specific schemas.

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'must be a 24-char hex ObjectId');

export const idParamSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict();

export const phoneSchema = z.string().trim().min(1).max(40);

export const profileImageSchema = z.string().url().max(2048);

// GeoJSON Point — [longitude, latitude]. Mongoose defaults `type` to 'Point';
// we accept it omitted and stamp it back so saved docs are always normalised.
export const locationSchema = z
  .object({
    type: z.literal('Point').optional().default('Point'),
    coordinates: z.tuple([
      z.number().gte(-180).lte(180),
      z.number().gte(-90).lte(90),
    ]),
  })
  .strict();

// Pagination — kept as a plain object so role-specific list schemas can
// extend it with filters. Coercion via z.coerce handles query strings.
export const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
} as const;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).max(128),
  })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'newPassword must differ from currentPassword',
    path: ['newPassword'],
  });

export type PasswordChange = z.infer<typeof passwordChangeSchema>;
