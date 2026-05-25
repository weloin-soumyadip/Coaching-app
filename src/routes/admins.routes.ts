import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import requireRole from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { adminSelfPatchSchema } from '../schemas/admins.schemas.js';
import { passwordChangeSchema } from '../schemas/common.js';
import { updateMe, deleteMe, changePassword } from '../controllers/admins.controller.js';

const router = Router();

router.patch(
  '/me',
  protect,
  requireRole('admin'),
  validate(adminSelfPatchSchema),
  asyncHandler(updateMe),
);
router.delete('/me', protect, requireRole('admin'), asyncHandler(deleteMe));
router.post(
  '/me/password',
  protect,
  requireRole('admin'),
  validate(passwordChangeSchema),
  asyncHandler(changePassword),
);

export default router;
