import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';
import { attachPasswordHooks, type PasswordMethods } from '../lib/auth/passwordHook.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ownerSchema = new Schema(
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
  },
  { timestamps: true },
);

export type OwnerAttrs = InferSchemaType<typeof ownerSchema>;
export type OwnerDoc = HydratedDocument<OwnerAttrs, PasswordMethods>;
export type OwnerModel = Model<OwnerAttrs, {}, PasswordMethods>;

attachPasswordHooks<OwnerAttrs>(ownerSchema);

const Owner: OwnerModel = model<OwnerAttrs, OwnerModel>('Owner', ownerSchema);
export default Owner;
