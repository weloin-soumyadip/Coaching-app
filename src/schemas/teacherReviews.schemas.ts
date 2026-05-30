import { z } from 'zod';
import { paginationFields } from './common.js';

// Create — teacher comes from the URL param, student from req.auth.
export const teacherReviewCreateSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();

// Update — rating and/or comment.
export const teacherReviewUpdateSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();

// Public list query — pagination only.
export const teacherReviewListQuerySchema = z
  .object({
    ...paginationFields,
  })
  .strict();

export type TeacherReviewCreate = z.infer<typeof teacherReviewCreateSchema>;
export type TeacherReviewUpdate = z.infer<typeof teacherReviewUpdateSchema>;
export type TeacherReviewListQuery = z.infer<typeof teacherReviewListQuerySchema>;
