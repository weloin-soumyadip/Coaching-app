import { z } from 'zod';
import { paginationFields, phoneSchema, profileImageSchema } from './common.js';

// Owner self-PATCH allow-list — anything outside this is rejected by .strict().
export const ownerSelfPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: phoneSchema.optional(),
    profileImage: profileImageSchema.optional(),
  })
  .strict();
export type OwnerSelfPatch = z.infer<typeof ownerSelfPatchSchema>;

// Admin-PATCH — same fields plus moderation flags.
export const ownerAdminPatchSchema = ownerSelfPatchSchema.extend({
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
}).strict();
export type OwnerAdminPatch = z.infer<typeof ownerAdminPatchSchema>;

// Admin list filters — coerced from query strings.
export const ownerListQuerySchema = z
  .object({
    ...paginationFields,
    q: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    isActive: z.coerce.boolean().optional(),
    isEmailVerified: z.coerce.boolean().optional(),
  })
  .strict();
export type OwnerListQuery = z.infer<typeof ownerListQuerySchema>;
