import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';

// Simple slugifier — lowercase, alnum + hyphen only.
const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
    },
    slug: { type: String, unique: true, lowercase: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type SubjectAttrs = InferSchemaType<typeof subjectSchema>;
export type SubjectDoc = HydratedDocument<SubjectAttrs>;
export type SubjectModel = Model<SubjectAttrs>;

// Derive slug from name before validation, so the unique check sees the final value.
// Mongoose 8+ uses promise/sync middleware — no `next` callback.
subjectSchema.pre('validate', function (this: SubjectDoc) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
});

subjectSchema.index({ category: 1 });

const Subject: SubjectModel = model<SubjectAttrs>('Subject', subjectSchema);
export default Subject;
