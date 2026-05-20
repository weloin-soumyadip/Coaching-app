const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    coachingCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachingCenter',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
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

// Recompute the denormalized fields on the parent CoachingCenter.
// Called by the hooks below whenever a review is written/updated/deleted.
reviewSchema.statics.recalcStats = async function (centerId) {
  if (!centerId) return;
  const CoachingCenter = mongoose.model('CoachingCenter');

  const stats = await this.aggregate([
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
reviewSchema.post('save', async function () {
  await this.constructor.recalcStats(this.coachingCenter);
});

// Query middleware — fires on findOneAndUpdate / findByIdAndUpdate.
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) await mongoose.model('Review').recalcStats(doc.coachingCenter);
});

// Query middleware — fires on findOneAndDelete / findByIdAndDelete.
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await mongoose.model('Review').recalcStats(doc.coachingCenter);
});

module.exports = mongoose.model('Review', reviewSchema);
