import type { Model } from 'mongoose';
import Owner from '../../models/Owner.js';
import Teacher from '../../models/Teacher.js';
import Student from '../../models/Student.js';
import Admin from '../../models/Admin.js';
import ApiError from '../../utils/ApiError.js';

// Machine-readable code so clients can branch on the error without parsing
// the human message. SCREAMING_SNAKE_CASE matches the rest of our error-code
// vocabulary (and most API-design style guides).
export const EMAIL_CONFLICT_CODE = 'EMAIL_ALREADY_EXISTS';

// Public response body for ANY cross-role email collision. Frozen so callers
// can't mutate it; centralized so a future copy or shape change touches one
// place. NEVER include role, id, or any field that could hint at which
// collection owns the email — account-enumeration attackers shop differences
// in responses, so all four roles must look identical from the outside.
export const EMAIL_CONFLICT_BODY = Object.freeze({
  success: false,
  error: Object.freeze({
    code: EMAIL_CONFLICT_CODE,
    message: 'An account with this email already exists.',
  }),
} as const);

export class EmailConflictError extends ApiError {
  constructor() {
    super(409, EMAIL_CONFLICT_BODY.error.message, EMAIL_CONFLICT_BODY);
  }
}

// All role collections that participate in cross-collection email uniqueness.
// Adding a new role is a one-line change here. `Model<unknown>` is the widest
// shape we need — every entry exposes `.exists()` with the same signature.
const ROLE_MODELS: ReadonlyArray<Model<unknown>> = [
  Owner as unknown as Model<unknown>,
  Teacher as unknown as Model<unknown>,
  Student as unknown as Model<unknown>,
  Admin as unknown as Model<unknown>,
];

// Application-level cross-collection email-uniqueness check.
//
// Schema-level `unique: true` only covers one collection at a time. We query
// every role in parallel so the email is rejected before insert if it's in
// use anywhere. Returns a plain boolean — by design impossible to leak which
// role matched.
//
// Race window: two concurrent registrations of the same email into different
// collections can both pass this check and both succeed. The error handler
// catches the resulting Mongo `E11000` and reshapes it to the same generic
// response, so the public surface stays identical either way.
export async function isEmailTaken(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const results = await Promise.all(
    ROLE_MODELS.map((Model) => Model.exists({ email: normalized })),
  );
  return results.some((hit) => hit !== null);
}

// Throws `EmailConflictError` if the email is already registered under any
// role. Controllers just `await` this and let the central error handler
// render the canonical response body.
export async function assertEmailAvailable(email: string): Promise<void> {
  if (await isEmailTaken(email)) {
    throw new EmailConflictError();
  }
}
