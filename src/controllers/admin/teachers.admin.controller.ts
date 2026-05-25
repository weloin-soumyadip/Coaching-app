import type { Request, Response } from 'express';
import ApiError from '../../utils/ApiError.js';
import Teacher from '../../models/Teacher.js';
import { revokeAllForUser } from '../../lib/auth/refreshTokens.js';
import { sanitize } from '../../lib/auth/sanitize.js';
import type {
  TeacherAdminPatch,
  TeacherListQuery,
} from '../../schemas/teachers.schemas.js';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, limit, q, city, isActive, isEmailVerified, isVerified } =
    req.query as unknown as TeacherListQuery;

  const filter: Record<string, unknown> = {};
  if (city) filter.city = city;
  if (isActive !== undefined) filter.isActive = isActive;
  if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified;
  if (isVerified !== undefined) filter.isVerified = isVerified;
  // Teacher has a text index on (name, bio, description) — use $text for relevance.
  if (q) filter.$text = { $search: q };

  const [data, total] = await Promise.all([
    Teacher.find(filter)
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Teacher.countDocuments(filter),
  ]);

  res.status(200).json({
    data: data.map(sanitize),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const doc = await Teacher.findById(id);
  if (!doc) throw new ApiError(404, 'Teacher not found');
  res.status(200).json({ user: sanitize(doc) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const updates = req.body as TeacherAdminPatch;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'no fields to update');
  }
  const doc = await Teacher.findById(id);
  if (!doc) throw new ApiError(404, 'Teacher not found');
  Object.assign(doc, updates);
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const doc = await Teacher.findById(id);
  if (!doc) throw new ApiError(404, 'Teacher not found');
  doc.isActive = false;
  await doc.save();
  await revokeAllForUser(String(doc._id));
  res.status(204).end();
}

export async function activate(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const doc = await Teacher.findById(id);
  if (!doc) throw new ApiError(404, 'Teacher not found');
  doc.isActive = true;
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}
