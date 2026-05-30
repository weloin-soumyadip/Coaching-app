import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import requireRole from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.js';
import { teacherReviewUpdateSchema } from '../schemas/teacherReviews.schemas.js';
import { update, remove } from '../controllers/teacherReviews.controller.js';

const router = Router();

// Author-only edit / delete of a teacher review.
router.patch(
  '/:id',
  protect,
  requireRole('student'),
  validate(idParamSchema, 'params'),
  validate(teacherReviewUpdateSchema),
  asyncHandler(update),
);
router.delete(
  '/:id',
  protect,
  requireRole('student'),
  validate(idParamSchema, 'params'),
  asyncHandler(remove),
);

export default router;
