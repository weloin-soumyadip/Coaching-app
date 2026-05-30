import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import requireRole from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { studentSelfPatchSchema } from '../schemas/students.schemas.js';
import { passwordChangeSchema } from '../schemas/common.js';
import { updateMe, deleteMe, changePassword } from '../controllers/students.controller.js';
import { getStudentDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/dashboard', protect, requireRole('student'), asyncHandler(getStudentDashboard));

router.patch(
  '/me',
  protect,
  requireRole('student'),
  validate(studentSelfPatchSchema),
  asyncHandler(updateMe),
);
router.delete('/me', protect, requireRole('student'), asyncHandler(deleteMe));
router.post(
  '/me/password',
  protect,
  requireRole('student'),
  validate(passwordChangeSchema),
  asyncHandler(changePassword),
);

export default router;
