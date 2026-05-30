import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
  type HydratedDocument,
} from 'mongoose';

// A Student rating a Teacher. Mirrors CoachingCenterReview.ts (which rates CoachingCenters)
// — same denormalisation strategy, but the parent is Teacher. See ADR-0006.
const teacherReviewSchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per student per teacher.
teacherReviewSchema.index({ teacher: 1, student: 1 }, { unique: true });

export type TeacherReviewAttrs = InferSchemaType<typeof teacherReviewSchema>;
export type TeacherReviewDoc = HydratedDocument<TeacherReviewAttrs>;

interface TeacherReviewModel extends Model<TeacherReviewAttrs> {
  recalcStats(teacherId: Types.ObjectId): Promise<void>;
}

// Recompute the denormalized fields on the parent Teacher.
// Called by the hooks below whenever a review is written/updated/deleted.
teacherReviewSchema.statics.recalcStats = async function (
  this: Model<TeacherReviewAttrs>,
  teacherId: Types.ObjectId
): Promise<void> {
  if (!teacherId) return;
  const Teacher = mongoose.model('Teacher');

  const stats = await this.aggregate<{ _id: Types.ObjectId; avg: number; count: number }>([
    { $match: { teacher: teacherId } },
    {
      $group: {
        _id: '$teacher',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await Teacher.findByIdAndUpdate(teacherId, {
    averageRating: Math.round(avg * 10) / 10, // 1-decimal precision
    totalReviews: count,
  });
};

// Document middleware — fires on TeacherReview.create / new TeacherReview().save().
teacherReviewSchema.post('save', async function (this: TeacherReviewDoc): Promise<void> {
  await (this.constructor as TeacherReviewModel).recalcStats(this.teacher);
});

// Query middleware — fires on findOneAndUpdate / findByIdAndUpdate.
teacherReviewSchema.post(
  'findOneAndUpdate',
  async function (doc: TeacherReviewDoc | null): Promise<void> {
    if (doc)
      await mongoose
        .model<TeacherReviewAttrs, TeacherReviewModel>('TeacherReview')
        .recalcStats(doc.teacher);
  }
);

// Query middleware — fires on findOneAndDelete / findByIdAndDelete.
teacherReviewSchema.post(
  'findOneAndDelete',
  async function (doc: TeacherReviewDoc | null): Promise<void> {
    if (doc)
      await mongoose
        .model<TeacherReviewAttrs, TeacherReviewModel>('TeacherReview')
        .recalcStats(doc.teacher);
  }
);

const TeacherReview = model<TeacherReviewAttrs, TeacherReviewModel>(
  'TeacherReview',
  teacherReviewSchema
);
export default TeacherReview;
