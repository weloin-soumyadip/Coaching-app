import type { Request, Response } from 'express';
import ApiError from '../utils/ApiError.js';
import { issue, type UserType } from '../lib/auth/jwt.js';
import { findEmailOwner } from '../lib/auth/emailUniqueness.js';
import Owner, { type OwnerDoc } from '../models/Owner.js';
import Teacher, { type TeacherDoc } from '../models/Teacher.js';
import Student, { type StudentDoc } from '../models/Student.js';
import Admin, { type AdminDoc } from '../models/Admin.js';
import type { AuthUser } from '../types/express.js';

type RegisterableUserType = Exclude<UserType, 'admin'>;
type AuthDoc = OwnerDoc | TeacherDoc | StudentDoc | AdminDoc;

const REGISTERABLE: ReadonlyArray<RegisterableUserType> = ['owner', 'teacher', 'student'];
const ALL_TYPES: ReadonlyArray<UserType> = ['owner', 'teacher', 'student', 'admin'];

function sanitize(doc: AuthDoc): Record<string, unknown> {
  const obj = doc.toObject({ versionKey: false }) as Record<string, unknown>;
  delete obj.password;
  return obj;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { userType, name, email, password, phone } = req.body as Partial<{
    userType: string;
    name: string;
    email: string;
    password: string;
    phone: string;
  }>;

  if (!userType || !REGISTERABLE.includes(userType as RegisterableUserType)) {
    throw new ApiError(400, `userType must be one of: ${REGISTERABLE.join(', ')}`);
  }
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email, and password are required');
  }

  const existing = await findEmailOwner(email);
  if (existing) {
    throw new ApiError(409, `Email already registered as ${existing.userType}`);
  }

  let doc: AuthDoc;
  const base = { name, email, password, ...(phone ? { phone } : {}) };
  switch (userType as RegisterableUserType) {
    case 'owner':
      doc = await Owner.create(base);
      break;
    case 'teacher':
      doc = await Teacher.create(base);
      break;
    case 'student':
      doc = await Student.create(base);
      break;
  }

  const token = issue({ sub: String(doc._id), userType: userType as UserType });
  res.status(201).json({ token, user: sanitize(doc) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { userType, email, password } = req.body as Partial<{
    userType: string;
    email: string;
    password: string;
  }>;

  if (!userType || !ALL_TYPES.includes(userType as UserType)) {
    throw new ApiError(400, `userType must be one of: ${ALL_TYPES.join(', ')}`);
  }
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  const normalized = email.toLowerCase().trim();
  const doc = await loadWithPassword(userType as UserType, normalized);
  if (!doc) throw new ApiError(401, 'Invalid credentials');
  if (!doc.isActive) throw new ApiError(401, 'Account is deactivated');

  const ok = await doc.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  if (userType === 'admin') {
    (doc as AdminDoc).lastLoginAt = new Date();
    await doc.save();
  }

  const token = issue({ sub: String(doc._id), userType: userType as UserType });
  res.status(200).json({ token, user: sanitize(doc) });
}

async function loadWithPassword(
  userType: UserType,
  email: string,
): Promise<AuthDoc | null> {
  // Cast per-branch because Mongoose's HydratedDocument is invariant in its
  // attrs; a union of four distinct doc shapes cannot accept any single one
  // by direct return. Runtime safety is guaranteed by the userType switch.
  switch (userType) {
    case 'owner':
      return (await Owner.findOne({ email }).select('+password')) as AuthDoc | null;
    case 'teacher':
      return (await Teacher.findOne({ email }).select('+password')) as AuthDoc | null;
    case 'student':
      return (await Student.findOne({ email }).select('+password')) as AuthDoc | null;
    case 'admin':
      return (await Admin.findOne({ email }).select('+password')) as AuthDoc | null;
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new ApiError(401, 'Not authenticated');
  // Discriminate so TS narrows the doc type and `sanitize` accepts it.
  const auth: AuthUser = req.auth;
  res.status(200).json({ userType: auth.type, user: sanitize(auth.doc) });
}

