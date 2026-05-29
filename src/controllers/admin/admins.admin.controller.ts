import type { Request, Response } from 'express';
import ApiError from '../../utils/ApiError.js';
import Admin from '../../models/Admin.js';
import { revokeAllForUser } from '../../lib/auth/refreshTokens.js';
import { sanitize } from '../../lib/auth/sanitize.js';
import { assertEmailAvailable } from '../../lib/auth/emailUniqueness.js';
import { escapeRegex } from '../../lib/crud/escapeRegex.js';
import type {
  AdminAdminPatch,
  AdminListQuery,
  CreateAdmin,
} from '../../schemas/admins.schemas.js';

function callerId(req: Request): string {
  if (!req.auth || req.auth.type !== 'admin') {
    throw new ApiError(401, 'Not authenticated as admin');
  }
  return String(req.auth.doc._id);
}

export async function list(req: Request, res: Response): Promise<void> {
  callerId(req);
  const { page, limit, q, isActive, isEmailVerified } =
    req.query as unknown as AdminListQuery;

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified;
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

  const [data, total] = await Promise.all([
    Admin.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Admin.countDocuments(filter),
  ]);

  res.status(200).json({
    data: data.map(sanitize),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  callerId(req);
  const { id } = req.params as { id: string };
  const doc = await Admin.findById(id);
  if (!doc) throw new ApiError(404, 'Admin not found');
  res.status(200).json({ user: sanitize(doc) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const me = callerId(req);
  const { id } = req.params as { id: string };
  const updates = req.body as AdminAdminPatch;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'no fields to update');
  }

  // Anti-lockout guards: admin cannot demote or deactivate themselves
  // via this endpoint. Use /me + /me/password for self-edits.
  const isSelf = me === id;
  if (isSelf && ('permissions' in updates || 'isActive' in updates)) {
    throw new ApiError(403, 'Admins cannot change own permissions or isActive via /admin/admins');
  }

  const doc = await Admin.findById(id);
  if (!doc) throw new ApiError(404, 'Admin not found');
  Object.assign(doc, updates);
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const me = callerId(req);
  const { id } = req.params as { id: string };
  if (me === id) {
    throw new ApiError(403, 'Cannot deactivate self');
  }
  const doc = await Admin.findById(id);
  if (!doc) throw new ApiError(404, 'Admin not found');
  doc.isActive = false;
  await doc.save();
  await revokeAllForUser(String(doc._id));
  res.status(204).end();
}

export async function activate(req: Request, res: Response): Promise<void> {
  callerId(req);
  const { id } = req.params as { id: string };
  const doc = await Admin.findById(id);
  if (!doc) throw new ApiError(404, 'Admin not found');
  doc.isActive = true;
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}

// Bootstrap a successor admin. Cross-collection email-uniqueness check.
// New admin must log in themselves — no auto-issued tokens.
export async function create(req: Request, res: Response): Promise<void> {
  const me = callerId(req);
  const { name, email, password, permissions } = req.body as CreateAdmin;

  await assertEmailAvailable(email);

  const newAdmin = await Admin.create({
    name,
    email,
    password,
    ...(permissions ? { permissions } : {}),
    createdBy: me,
  });

  res.status(201).json({ user: sanitize(newAdmin) });
}
