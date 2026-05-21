// Augments Express's Request with a tagged-union `auth` field set by the
// `protect` middleware. Type-only file; loaded automatically because it sits
// inside the tsconfig `include` glob and uses `declare global`.

import type { HydratedDocument } from 'mongoose';
import type { OwnerAttrs } from '../models/Owner.js';
import type { TeacherAttrs } from '../models/Teacher.js';
import type { StudentAttrs } from '../models/Student.js';
import type { AdminAttrs } from '../models/Admin.js';
import type { PasswordMethods } from '../lib/auth/passwordHook.js';

export type AuthUser =
  | { type: 'owner'; doc: HydratedDocument<OwnerAttrs, PasswordMethods> }
  | { type: 'teacher'; doc: HydratedDocument<TeacherAttrs, PasswordMethods> }
  | { type: 'student'; doc: HydratedDocument<StudentAttrs, PasswordMethods> }
  | { type: 'admin'; doc: HydratedDocument<AdminAttrs, PasswordMethods> };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export {};
