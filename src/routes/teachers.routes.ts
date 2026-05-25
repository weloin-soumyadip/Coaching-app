import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import requireRole from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { teacherSelfPatchSchema } from '../schemas/teachers.schemas.js';
import { idParamSchema, passwordChangeSchema } from '../schemas/common.js';
import {
  updateMe,
  deleteMe,
  changePassword,
  getPublic,
} from '../controllers/teachers.controller.js';

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

export default router;
