import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
  type HydratedDocument,
} from 'mongoose';

const reviewSchema = new Schema(
  {
    coachingCenter: {
      type: Schema.Types.ObjectId,
      ref: 'CoachingCenter',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per student per coaching center.
reviewSchema.index({ coachingCenter: 1, student: 1 }, { unique: true });

export type ReviewAttrs = InferSchemaType<typeof reviewSchema>;
export type ReviewDoc = HydratedDocument<ReviewAttrs>;

interface ReviewModel extends Model<ReviewAttrs> {
  recalcStats(centerId: Types.ObjectId): Promise<void>;
}

// Recompute the denormalized fields on the parent CoachingCenter.
// Called by the hooks below whenever a review is written/updated/deleted.
reviewSchema.statics.recalcStats = async function (
  this: Model<ReviewAttrs>,
  centerId: Types.ObjectId
): Promise<void> {
  if (!centerId) return;
  const CoachingCenter = mongoose.model('CoachingCenter');

  const stats = await this.aggregate<{ _id: Types.ObjectId; avg: number; count: number }>([
    { $match: { coachingCenter: centerId } },
    {
      $group: {
        _id: '$coachingCenter',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await CoachingCenter.findByIdAndUpdate(centerId, {
    averageRating: Math.round(avg * 10) / 10, // 1-decimal precision
    totalReviews: count,
  });
};

// Document middleware — fires on Review.create / new Review().save().
reviewSchema.post('save', async function (this: ReviewDoc): Promise<void> {
  await (this.constructor as ReviewModel).recalcStats(this.coachingCenter);
});

// Query middleware — fires on findOneAndUpdate / findByIdAndUpdate.
reviewSchema.post('findOneAndUpdate', async function (doc: ReviewDoc | null): Promise<void> {
  if (doc) await mongoose.model<ReviewAttrs, ReviewModel>('Review').recalcStats(doc.coachingCenter);
});

// Query middleware — fires on findOneAndDelete / findByIdAndDelete.
reviewSchema.post('findOneAndDelete', async function (doc: ReviewDoc | null): Promise<void> {
  if (doc) await mongoose.model<ReviewAttrs, ReviewModel>('Review').recalcStats(doc.coachingCenter);
});

const Review = model<ReviewAttrs, ReviewModel>('Review', reviewSchema);
export default Review;
