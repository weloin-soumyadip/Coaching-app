import { z } from 'zod';
import { paginationFields, phoneSchema, profileImageSchema } from './common.js';

export const ADMIN_PERMISSION_VALUES = [
  'users',
  'centers',
  'courses',
  'subjects',
  'reviews',
  'reports',
] as const;

// Admin self-PATCH — basic profile fields only. Permissions are admin-on-admin only.
export const adminSelfPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: phoneSchema.optional(),
    profileImage: profileImageSchema.optional(),
  })
  .strict();
export type AdminSelfPatch = z.infer<typeof adminSelfPatchSchema>;

// Admin moderation of another admin — can edit permissions[], isActive,
// isEmailVerified. The controller additionally guards against self-edits of
// permissions / isActive (to prevent lockout).
export const adminAdminPatchSchema = adminSelfPatchSchema.extend({
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  permissions: z.array(z.enum(ADMIN_PERMISSION_VALUES)).optional(),
}).strict();
export type AdminAdminPatch = z.infer<typeof adminAdminPatchSchema>;

// Bootstrap successor admin.
export const createAdminSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(6).max(128),
    permissions: z.array(z.enum(ADMIN_PERMISSION_VALUES)).optional(),
  })
  .strict();
export type CreateAdmin = z.infer<typeof createAdminSchema>;

export const adminListQuerySchema = z
  .object({
    ...paginationFields,
    q: z.string().trim().min(1).optional(),
    isActive: z.coerce.boolean().optional(),
    isEmailVerified: z.coerce.boolean().optional(),
  })
  .strict();
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
