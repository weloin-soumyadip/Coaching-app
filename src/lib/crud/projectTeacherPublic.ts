import type { TeacherDoc } from '../../models/Teacher.js';

// Public-facing teacher projection — excludes contact info and internal/audit
// flags. Allow-list (not deny-list) so any new sensitive field added later
// won't accidentally leak.
const PUBLIC_FIELDS = [
  '_id',
  'name',
  'profileImage',
  'bio',
  'description',
  'subjects',
  'education',
  'experienceYears',
  'feesRange',
  'batches',
  'languages',
  'boards',
  'classRange',
  'location',
  'city',
  'state',
  'averageRating',
  'totalReviews',
  'isVerified',
  'createdAt',
] as const;

export function projectTeacherPublic(doc: TeacherDoc): Record<string, unknown> {
  const obj = doc.toObject({ versionKey: false }) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_FIELDS) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
