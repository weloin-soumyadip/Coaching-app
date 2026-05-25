import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import protect from '../middleware/protect.js';
import { register, login, me, refresh, logout } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', protect, asyncHandler(me));

export default router;
