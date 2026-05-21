import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';
import { attachPasswordHooks, type PasswordMethods } from '../lib/auth/passwordHook.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ADMIN_PERMISSIONS = [
  'users',
  'centers',
  'courses',
  'subjects',
  'reviews',
  'reports',
] as const;

const adminSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    permissions: {
      type: [String],
      enum: ADMIN_PERMISSIONS,
      default: [...ADMIN_PERMISSIONS],
    },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export type AdminAttrs = InferSchemaType<typeof adminSchema>;
export type AdminDoc = HydratedDocument<AdminAttrs, PasswordMethods>;
export type AdminModel = Model<AdminAttrs, {}, PasswordMethods>;

attachPasswordHooks<AdminAttrs>(adminSchema);

const Admin: AdminModel = model<AdminAttrs, AdminModel>('Admin', adminSchema);
export default Admin;
