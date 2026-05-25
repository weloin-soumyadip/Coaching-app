import type { Request, Response } from 'express';
import ApiError from '../utils/ApiError.js';
import Owner from '../models/Owner.js';
import { issueAccess } from '../lib/auth/jwt.js';
import { issueNewRefresh, revokeAllForUser } from '../lib/auth/refreshTokens.js';
import { setRefreshCookie, clearRefreshCookie } from '../lib/auth/cookies.js';
import { sanitize } from '../lib/auth/sanitize.js';
import type { OwnerSelfPatch } from '../schemas/owners.schemas.js';
import type { PasswordChange } from '../schemas/common.js';

function requireOwner(req: Request) {
  if (!req.auth || req.auth.type !== 'owner') {
    throw new ApiError(401, 'Not authenticated as owner');
  }
  return req.auth.doc;
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const doc = requireOwner(req);
  const updates = req.body as OwnerSelfPatch;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'no fields to update');
  }
  Object.assign(doc, updates);
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}

export async function deleteMe(req: Request, res: Response): Promise<void> {
  const doc = requireOwner(req);
  doc.isActive = false;
  await doc.save();
  await revokeAllForUser(String(doc._id));
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const doc = requireOwner(req);
  const { currentPassword, newPassword } = req.body as PasswordChange;

  // Re-fetch with password field included — the doc on req.auth has select:false applied.
  const withPassword = await Owner.findById(doc._id).select('+password');
  if (!withPassword) throw new ApiError(401, 'Account no longer exists');

  const ok = await withPassword.comparePassword(currentPassword);
  if (!ok) throw new ApiError(401, 'Invalid current password');

  withPassword.password = newPassword;
  await withPassword.save();

  // Kick every active session for this user, then re-issue tokens for the
  // current call so the caller stays logged in on this device.
  const sub = String(withPassword._id);
  await revokeAllForUser(sub);

  const accessToken = issueAccess({ sub, userType: 'owner' });
  const refresh = await issueNewRefresh(sub, 'owner');
  setRefreshCookie(res, refresh);

  res.status(200).json({ token: accessToken });
}
