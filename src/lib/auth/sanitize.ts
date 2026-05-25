import type { OwnerDoc } from '../../models/Owner.js';
import type { TeacherDoc } from '../../models/Teacher.js';
import type { StudentDoc } from '../../models/Student.js';
import type { AdminDoc } from '../../models/Admin.js';

export type AuthDoc = OwnerDoc | TeacherDoc | StudentDoc | AdminDoc;

// Strip the password field and versionKey from any role doc before sending
// over the wire. Used by every controller that returns a user representation.
export function sanitize(doc: AuthDoc): Record<string, unknown> {
  const obj = doc.toObject({ versionKey: false }) as Record<string, unknown>;
  delete obj.password;
  return obj;
}
