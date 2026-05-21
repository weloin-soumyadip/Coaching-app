import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';
import { attachPasswordHooks, type PasswordMethods } from '../lib/auth/passwordHook.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const studentLocationSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: unknown) => Array.isArray(v) && v.length === 2,
        message: 'Coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false },
);

const studentSchema = new Schema(
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

    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    currentClass: { type: Number, min: 1, max: 12 },
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State', 'IB', 'IGCSE', 'Other'],
    },
    city: { type: String, trim: true },
    location: { type: studentLocationSchema },
  },
  { timestamps: true },
);

studentSchema.index({ location: '2dsphere' }, { sparse: true });
studentSchema.index({ city: 1 });

export type StudentAttrs = InferSchemaType<typeof studentSchema>;
export type StudentDoc = HydratedDocument<StudentAttrs, PasswordMethods>;
export type StudentModel = Model<StudentAttrs, {}, PasswordMethods>;

attachPasswordHooks<StudentAttrs>(studentSchema);

const Student: StudentModel = model<StudentAttrs, StudentModel>('Student', studentSchema);
export default Student;
