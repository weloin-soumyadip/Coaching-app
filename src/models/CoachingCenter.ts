import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // 'HH:MM' 24-hour

const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// GeoJSON Point sub-schema — paired with a 2dsphere index below.
const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON convention
      required: true,
      validate: {
        validator: (v: unknown) => Array.isArray(v) && v.length === 2,
        message: 'Coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false }
);

// Per-day timing entry. closed=true overrides openTime/closeTime.
const timingSchema = new Schema(
  {
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      required: true,
    },
    openTime: { type: String, match: TIME_REGEX },
    closeTime: { type: String, match: TIME_REGEX },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const coachingCenterSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: { type: String, required: true, trim: true },
    location: { type: pointSchema, required: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email'],
    },
    website: { type: String, trim: true },
    subjectsOffered: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
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
    fees: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
    timings: [timingSchema],
    profileImage: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    gallery: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Denormalized rating fields — kept in sync by Review hooks (see ADR-0004).
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export type CoachingCenterAttrs = InferSchemaType<typeof coachingCenterSchema>;
export type CoachingCenterDoc = HydratedDocument<CoachingCenterAttrs>;
export type CoachingCenterModel = Model<CoachingCenterAttrs>;

// Derive slug from name + city; suffix with a short random string to avoid
// collisions across centers with the same name in the same city.
// Mongoose 8+/9+ uses promise-style middleware — no `next` callback.
coachingCenterSchema.pre('validate', function (this: CoachingCenterDoc) {
  if (this.isModified('name') || this.isModified('city') || !this.slug) {
    const base = slugify(`${this.name}-${this.city || ''}`);
    const suffix = Math.random().toString(36).slice(2, 6);
    this.slug = `${base}-${suffix}`;
  }
});

// Indexes — see ADR-0001 (geo) and the spec's Indexes table.
coachingCenterSchema.index({ location: '2dsphere' });
coachingCenterSchema.index({ name: 'text', description: 'text', area: 'text' });
coachingCenterSchema.index({ owner: 1 });
coachingCenterSchema.index({ subjectsOffered: 1 });
coachingCenterSchema.index({ city: 1, isActive: 1, isVerified: 1 });
coachingCenterSchema.index({ averageRating: -1 });

const CoachingCenter: CoachingCenterModel = model<CoachingCenterAttrs>(
  'CoachingCenter',
  coachingCenterSchema
);
export default CoachingCenter;
