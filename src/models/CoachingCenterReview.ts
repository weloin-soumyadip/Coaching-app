import mongoose, {
  Schema,
  model,
  Types,
  type InferSchemaType,
  type Model,
  type HydratedDocument,
} from 'mongoose';

const coachingCenterReviewSchema = new Schema(
  {
    coachingCenter: {
      type: Schema.Types.ObjectId,
      ref: 'CoachingCenter',
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
  // Pin the collection name so renaming the model doesn't orphan existing
  // `reviews` documents (Mongoose would otherwise derive `coachingcenterreviews`).
  { timestamps: true, collection: 'reviews' }
);

// One review per student per coaching center.
coachingCenterReviewSchema.index({ coachingCenter: 1, student: 1 }, { unique: true });

export type CoachingCenterReviewAttrs = InferSchemaType<typeof coachingCenterReviewSchema>;
export type CoachingCenterReviewDoc = HydratedDocument<CoachingCenterReviewAttrs>;

interface CoachingCenterReviewModel extends Model<CoachingCenterReviewAttrs> {
  recalcStats(centerId: Types.ObjectId): Promise<void>;
}

// Recompute the denormalized fields on the parent CoachingCenter.
// Called by the hooks below whenever a review is written/updated/deleted.
coachingCenterReviewSchema.statics.recalcStats = async function (
  this: Model<CoachingCenterReviewAttrs>,
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

// Document middleware — fires on CoachingCenterReview.create / new ...().save().
coachingCenterReviewSchema.post(
  'save',
  async function (this: CoachingCenterReviewDoc): Promise<void> {
    await (this.constructor as CoachingCenterReviewModel).recalcStats(this.coachingCenter);
  }
);

// Query middleware — fires on findOneAndUpdate / findByIdAndUpdate.
coachingCenterReviewSchema.post(
  'findOneAndUpdate',
  async function (doc: CoachingCenterReviewDoc | null): Promise<void> {
    if (doc)
      await mongoose
        .model<CoachingCenterReviewAttrs, CoachingCenterReviewModel>('CoachingCenterReview')
        .recalcStats(doc.coachingCenter);
  }
);

// Query middleware — fires on findOneAndDelete / findByIdAndDelete.
coachingCenterReviewSchema.post(
  'findOneAndDelete',
  async function (doc: CoachingCenterReviewDoc | null): Promise<void> {
    if (doc)
      await mongoose
        .model<CoachingCenterReviewAttrs, CoachingCenterReviewModel>('CoachingCenterReview')
        .recalcStats(doc.coachingCenter);
  }
);

const CoachingCenterReview = model<CoachingCenterReviewAttrs, CoachingCenterReviewModel>(
  'CoachingCenterReview',
  coachingCenterReviewSchema
);
export default CoachingCenterReview;
