import type { Request, Response } from 'express';
import ApiError from '../../utils/ApiError.js';
import Student from '../../models/Student.js';
import { revokeAllForUser } from '../../lib/auth/refreshTokens.js';
import { sanitize } from '../../lib/auth/sanitize.js';
import { escapeRegex } from '../../lib/crud/escapeRegex.js';
import type {
  StudentAdminPatch,
  StudentListQuery,
} from '../../schemas/students.schemas.js';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, limit, q, city, isActive, isEmailVerified } =
    req.query as unknown as StudentListQuery;

  const filter: Record<string, unknown> = {};
  if (city) filter.city = city;
  if (isActive !== undefined) filter.isActive = isActive;
  if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified;
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

  const [data, total] = await Promise.all([
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  res.status(200).json({
    data: data.map(sanitize),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const doc = await Student.findById(id);
  if (!doc) throw new ApiError(404, 'Student not found');
  res.status(200).json({ user: sanitize(doc) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const updates = req.body as StudentAdminPatch;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'no fields to update');
  }
  const doc = await Student.findById(id);
  if (!doc) throw new ApiError(404, 'Student not found');
  Object.assign(doc, updates);
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const doc = await Student.findById(id);
  if (!doc) throw new ApiError(404, 'Student not found');
  doc.isActive = false;
  await doc.save();
  await revokeAllForUser(String(doc._id));
  res.status(204).end();
}

export async function activate(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const doc = await Student.findById(id);
  if (!doc) throw new ApiError(404, 'Student not found');
  doc.isActive = true;
  await doc.save();
  res.status(200).json({ user: sanitize(doc) });
}
