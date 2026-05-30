import type { Request, Response } from 'express';
import TeacherReview from '../models/TeacherReview.js';
import Teacher from '../models/Teacher.js';
import ApiError from '../utils/ApiError.js';
import type {
  TeacherReviewCreate,
  TeacherReviewUpdate,
  TeacherReviewListQuery,
} from '../schemas/teacherReviews.schemas.js';

function requireStudent(req: Request) {
  if (!req.auth || req.auth.type !== 'student') {
    throw new ApiError(401, 'Not authenticated as student');
  }
  return req.auth.doc;
}

// Public-facing review shape. Allow-list so internal fields never leak.
const PUBLIC_FIELDS = [
  '_id',
  'teacher',
  'student',
  'rating',
  'comment',
  'isEdited',
  'createdAt',
  'updatedAt',
] as const;

function projectReviewPublic(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_FIELDS) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

// POST /api/teachers/:id/reviews — a student reviews a teacher.
export async function create(req: Request, res: Response): Promise<void> {
  const student = requireStudent(req);
  const { id: teacherId } = req.params as { id: string };
  const body = req.body as TeacherReviewCreate;

  // Teacher must exist and be active before accepting a review.
  const teacher = await Teacher.exists({ _id: teacherId, isActive: true });
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  try {
    const doc = await TeacherReview.create({
      teacher: teacherId,
      student: student._id,
      rating: body.rating,
      comment: body.comment,
    });
    res.status(201).json({ success: true, review: projectReviewPublic(doc.toObject()) });
  } catch (err) {
    // Unique (teacher, student) — one review per student per teacher.
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError(409, 'You have already reviewed this teacher');
    }
    throw err;
  }
}

// GET /api/teachers/:id/reviews — public list of a teacher's reviews.
export async function listForTeacher(req: Request, res: Response): Promise<void> {
  const { id: teacherId } = req.params as { id: string };
  const { page, limit } = req.query as unknown as TeacherReviewListQuery;

  const filter = { teacher: teacherId };
  const [data, total] = await Promise.all([
    TeacherReview.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name profileImage')
      .lean(),
    TeacherReview.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: data.map((r) => projectReviewPublic(r as Record<string, unknown>)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

// PATCH /api/teacher-reviews/:id — author edits their own review.
export async function update(req: Request, res: Response): Promise<void> {
  const student = requireStudent(req);
  const { id } = req.params as { id: string };
  const updates = req.body as TeacherReviewUpdate;
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'no fields to update');
  }

  const doc = await TeacherReview.findById(id);
  if (!doc) throw new ApiError(404, 'Review not found');
  if (String(doc.student) !== String(student._id)) {
    throw new ApiError(403, 'Not your review');
  }

  Object.assign(doc, updates);
  doc.isEdited = true;
  await doc.save(); // triggers recalcStats via post('save')
  res.status(200).json({ success: true, review: projectReviewPublic(doc.toObject()) });
}

// DELETE /api/teacher-reviews/:id — author deletes their own review.
export async function remove(req: Request, res: Response): Promise<void> {
  const student = requireStudent(req);
  const { id } = req.params as { id: string };

  const doc = await TeacherReview.findById(id);
  if (!doc) throw new ApiError(404, 'Review not found');
  if (String(doc.student) !== String(student._id)) {
    throw new ApiError(403, 'Not your review');
  }

  // findOneAndDelete triggers the recalcStats hook (post('findOneAndDelete')).
  await TeacherReview.findOneAndDelete({ _id: id });
  res.status(204).end();
}
