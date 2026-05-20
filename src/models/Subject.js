const mongoose = require('mongoose');

// Simple slugifier — lowercase, alnum + hyphen only.
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const subjectSchema = new mongoose.Schema(
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

// Derive slug from name before validation, so the unique check sees the final value.
// Mongoose 8+ uses promise/sync middleware — no `next` callback.
subjectSchema.pre('validate', function () {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
});

subjectSchema.index({ category: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
