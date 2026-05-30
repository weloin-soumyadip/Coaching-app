import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import requireRole from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../schemas/common.js';
import {
  webinarCreateSchema,
  webinarUpdateSchema,
  webinarListQuerySchema,
} from '../schemas/webinars.schemas.js';
import { create, list, getOne, update, remove } from '../controllers/webinars.controller.js';

const router = Router();

// Public reads
router.get('/', validate(webinarListQuerySchema, 'query'), asyncHandler(list));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(getOne));

// Teacher-authored CRUD
router.post(
  '/',
  protect,
  requireRole('teacher'),
  validate(webinarCreateSchema),
  asyncHandler(create),
);
router.patch(
  '/:id',
  protect,
  requireRole('teacher'),
  validate(idParamSchema, 'params'),
  validate(webinarUpdateSchema),
  asyncHandler(update),
);
router.delete(
  '/:id',
  protect,
  requireRole('teacher'),
  validate(idParamSchema, 'params'),
  asyncHandler(remove),
);

export default router;
