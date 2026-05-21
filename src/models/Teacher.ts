import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';
import { attachPasswordHooks, type PasswordMethods } from '../lib/auth/passwordHook.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const educationSchema = new Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, trim: true },
    year: { type: Number, min: 1900, max: 2100 },
    field: { type: String, trim: true },
  },
  { _id: false },
);

const batchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    days: [
      {
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ],
    startTime: { type: String, match: TIME_REGEX },
    endTime: { type: String, match: TIME_REGEX },
    capacity: { type: Number, min: 1 },
  },
  { _id: false },
);

const teacherLocationSchema = new Schema(
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

const teacherSchema = new Schema(
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

    bio: { type: String, trim: true },
    description: { type: String, trim: true },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    education: [educationSchema],
    experienceYears: { type: Number, min: 0 },
    feesRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
    batches: [batchSchema],
    languages: [{ type: String, trim: true }],
    boards: [
      {
        type: String,
        enum: ['CBSE', 'ICSE', 'State', 'IB', 'IGCSE', 'Other'],
      },
    ],
    classRange: {
      from: { type: Number, min: 1, max: 12 },
      to: { type: Number, min: 1, max: 12 },
    },
    location: { type: teacherLocationSchema },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },

    // Denormalized — kept in sync by TeacherReview hooks. See ADR-0006.
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

teacherSchema.index({ name: 'text', bio: 'text', description: 'text' });
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ 'feesRange.min': 1, 'feesRange.max': 1 });
teacherSchema.index({ averageRating: -1 });
teacherSchema.index({ location: '2dsphere' }, { sparse: true });
teacherSchema.index({ city: 1, isActive: 1, isVerified: 1 });

export type TeacherAttrs = InferSchemaType<typeof teacherSchema>;
export type TeacherDoc = HydratedDocument<TeacherAttrs, PasswordMethods>;
export type TeacherModel = Model<TeacherAttrs, {}, PasswordMethods>;

attachPasswordHooks<TeacherAttrs>(teacherSchema);

const Teacher: TeacherModel = model<TeacherAttrs, TeacherModel>('Teacher', teacherSchema);
export default Teacher;
