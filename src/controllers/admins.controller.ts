import type { Request, Response } from 'express';
import ApiError from '../utils/ApiError.js';
import Admin from '../models/Admin.js';
import { issueAccess } from '../lib/auth/jwt.js';
import { issueNewRefresh, revokeAllForUser } from '../lib/auth/refreshTokens.js';
import { setRefreshCookie, clearRefreshCookie } from '../lib/auth/cookies.js';
import { sanitize } from '../lib/auth/sanitize.js';
import type { AdminSelfPatch } from '../schemas/admins.schemas.js';
import type { PasswordChange } from '../schemas/common.js';

function requireAdmin(req: Request) {
  if (!req.auth || req.auth.type !== 'admin') {
    throw new ApiError(401, 'Not authenticated as admin');
  }
  return req.auth.doc;
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const doc = requireAdmin(req);
  const updates = req.body as AdminSelfPatch;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'no fields to update');
  }
  Object.assign(doc, updates);
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}

export async function deleteMe(req: Request, res: Response): Promise<void> {
  const doc = requireAdmin(req);
  doc.isActive = false;
  await doc.save();
  await revokeAllForUser(String(doc._id));
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const doc = requireAdmin(req);
  const { currentPassword, newPassword } = req.body as PasswordChange;

  const withPassword = await Admin.findById(doc._id).select('+password');
  if (!withPassword) throw new ApiError(401, 'Account no longer exists');

  const ok = await withPassword.comparePassword(currentPassword);
  if (!ok) throw new ApiError(401, 'Invalid current password');

  withPassword.password = newPassword;
  await withPassword.save();

  const sub = String(withPassword._id);
  await revokeAllForUser(sub);

  const accessToken = issueAccess({ sub, userType: 'admin' });
  const refresh = await issueNewRefresh(sub, 'admin');
  setRefreshCookie(res, refresh);

  res.status(200).json({ token: accessToken });
}
