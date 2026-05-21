import type { Types } from 'mongoose';
import Owner from '../../models/Owner.js';
import Teacher from '../../models/Teacher.js';
import Student from '../../models/Student.js';
import Admin from '../../models/Admin.js';
import type { UserType } from './jwt.js';

// Application-level cross-collection email uniqueness check.
//
// Schema-level `unique: true` only checks one collection. We run four parallel
// queries to ensure an email isn't already in use by *any* role before insert.
//
// Race window: two concurrent registrations of the same email into different
// collections can both succeed. Accepted for Phase 2 (see ADR-0005); standalone
// Mongo means no transactions.
export async function findEmailOwner(
  email: string,
): Promise<{ userType: UserType; id: Types.ObjectId } | null> {
  const normalized = email.toLowerCase().trim();
  const [ownerHit, teacherHit, studentHit, adminHit] = await Promise.all([
    Owner.findOne({ email: normalized }).select('_id').lean<{ _id: Types.ObjectId } | null>(),
    Teacher.findOne({ email: normalized }).select('_id').lean<{ _id: Types.ObjectId } | null>(),
    Student.findOne({ email: normalized }).select('_id').lean<{ _id: Types.ObjectId } | null>(),
    Admin.findOne({ email: normalized }).select('_id').lean<{ _id: Types.ObjectId } | null>(),
  ]);

  if (ownerHit) return { userType: 'owner', id: ownerHit._id };
  if (teacherHit) return { userType: 'teacher', id: teacherHit._id };
  if (studentHit) return { userType: 'student', id: studentHit._id };
  if (adminHit) return { userType: 'admin', id: adminHit._id };
  return null;
}
