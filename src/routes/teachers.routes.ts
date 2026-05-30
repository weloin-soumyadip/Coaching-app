import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import requireRole from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { teacherSelfPatchSchema } from '../schemas/teachers.schemas.js';
import { idParamSchema, passwordChangeSchema } from '../schemas/common.js';
import {
  teacherReviewCreateSchema,
  teacherReviewListQuerySchema,
} from '../schemas/teacherReviews.schemas.js';
import {
  updateMe,
  deleteMe,
  changePassword,
  getPublic,
} from '../controllers/teachers.controller.js';
import {
  create as createReview,
  listForTeacher as listReviews,
} from '../controllers/teacherReviews.controller.js';

const router = Router();

// Authenticated self-management.
router.patch(
  '/me',
  protect,
  requireRole('teacher'),
  validate(teacherSelfPatchSchema),
  asyncHandler(updateMe),
);
router.delete('/me', protect, requireRole('teacher'), asyncHandler(deleteMe));
router.post(
  '/me/password',
  protect,
  requireRole('teacher'),
  validate(passwordChangeSchema),
  asyncHandler(changePassword),
);

// Public — no auth required.
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(getPublic));

// Teacher reviews — public list, student-authored create.
router.get(
  '/:id/reviews',
  validate(idParamSchema, 'params'),
  validate(teacherReviewListQuerySchema, 'query'),
  asyncHandler(listReviews),
);
router.post(
  '/:id/reviews',
  protect,
  requireRole('student'),
  validate(idParamSchema, 'params'),
  validate(teacherReviewCreateSchema),
  asyncHandler(createReview),
);

export default router;
