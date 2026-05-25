import { z } from 'zod';
import {
  locationSchema,
  paginationFields,
  phoneSchema,
  profileImageSchema,
} from './common.js';

const GENDER_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
const BOARD_VALUES = ['CBSE', 'ICSE', 'State', 'IB', 'IGCSE', 'Other'] as const;

export const studentSelfPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: phoneSchema.optional(),
    profileImage: profileImageSchema.optional(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(GENDER_VALUES).optional(),
    currentClass: z.number().int().min(1).max(12).optional(),
    board: z.enum(BOARD_VALUES).optional(),
    city: z.string().trim().min(1).optional(),
    location: locationSchema.optional(),
  })
  .strict();
export type StudentSelfPatch = z.infer<typeof studentSelfPatchSchema>;

export const studentAdminPatchSchema = studentSelfPatchSchema.extend({
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
}).strict();
export type StudentAdminPatch = z.infer<typeof studentAdminPatchSchema>;

export const studentListQuerySchema = z
  .object({
    ...paginationFields,
    q: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    isActive: z.coerce.boolean().optional(),
    isEmailVerified: z.coerce.boolean().optional(),
  })
  .strict();
export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
