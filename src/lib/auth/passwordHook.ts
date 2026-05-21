import bcrypt from 'bcryptjs';
import type { Schema, HydratedDocument } from 'mongoose';

const BCRYPT_ROUNDS = 12;

// Attached to each role schema (Owner/Teacher/Student/Admin) — bcrypt-hashes the
// password on save when modified, and exposes comparePassword(plain) on the doc.
// Factory-per-schema (rather than a base schema) so InferSchemaType stays clean
// under strict mode.
export function attachPasswordHooks<T extends { password: string }>(
  schema: Schema<T>,
): void {
  schema.pre('save', async function (this: HydratedDocument<T>): Promise<void> {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  });

  schema.method(
    'comparePassword',
    async function (this: HydratedDocument<T>, plain: string): Promise<boolean> {
      return bcrypt.compare(plain, this.password);
    },
  );
}

export interface PasswordMethods {
  comparePassword(plain: string): Promise<boolean>;
}
