import { z } from 'zod';
import {
  locationSchema,
  objectIdSchema,
  paginationFields,
  phoneSchema,
  profileImageSchema,
} from './common.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_VALUES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const BOARD_VALUES = ['CBSE', 'ICSE', 'State', 'IB', 'IGCSE', 'Other'] as const;

const educationItemSchema = z
  .object({
    degree: z.string().trim().min(1),
    institution: z.string().trim().min(1).optional(),
    year: z.number().int().gte(1900).lte(2100).optional(),
    field: z.string().trim().min(1).optional(),
  })
  .strict();

const batchItemSchema = z
  .object({
    name: z.string().trim().min(1),
    days: z.array(z.enum(DAY_VALUES)).optional(),
    startTime: z.string().regex(TIME_REGEX, 'must be HH:mm').optional(),
    endTime: z.string().regex(TIME_REGEX, 'must be HH:mm').optional(),
    capacity: z.number().int().min(1).optional(),
  })
  .strict();

const feesRangeSchema = z
  .object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
    currency: z.string().trim().min(1).max(8).optional(),
  })
  .strict()
  .refine((v) => v.min === undefined || v.max === undefined || v.min <= v.max, {
    message: 'min must be <= max',
    path: ['min'],
  });

const classRangeSchema = z
  .object({
    from: z.number().int().min(1).max(12).optional(),
    to: z.number().int().min(1).max(12).optional(),
  })
  .strict()
  .refine((v) => v.from === undefined || v.to === undefined || v.from <= v.to, {
    message: 'from must be <= to',
    path: ['from'],
  });

export const teacherSelfPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: phoneSchema.optional(),
    profileImage: profileImageSchema.optional(),
    bio: z.string().trim().max(2000).optional(),
    description: z.string().trim().max(10000).optional(),
    subjects: z.array(objectIdSchema).optional(),
    education: z.array(educationItemSchema).optional(),
    experienceYears: z.number().int().min(0).max(80).optional(),
    feesRange: feesRangeSchema.optional(),
    batches: z.array(batchItemSchema).optional(),
    languages: z.array(z.string().trim().min(1)).optional(),
    boards: z.array(z.enum(BOARD_VALUES)).optional(),
    classRange: classRangeSchema.optional(),
    location: locationSchema.optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    pincode: z.string().trim().min(1).max(12).optional(),
  })
  .strict();
export type TeacherSelfPatch = z.infer<typeof teacherSelfPatchSchema>;

// Admin adds moderation flags. averageRating/totalReviews stay denormalised
// (Review hooks own them) — explicitly excluded so admins can't poison stats.
export const teacherAdminPatchSchema = teacherSelfPatchSchema.extend({
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  isVerified: z.boolean().optional(),
}).strict();
export type TeacherAdminPatch = z.infer<typeof teacherAdminPatchSchema>;

export const teacherListQuerySchema = z
  .object({
    ...paginationFields,
    q: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    isActive: z.coerce.boolean().optional(),
    isEmailVerified: z.coerce.boolean().optional(),
    isVerified: z.coerce.boolean().optional(),
  })
  .strict();
export type TeacherListQuery = z.infer<typeof teacherListQuerySchema>;
