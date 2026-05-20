const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    coachingCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachingCenter',
      required: true,
    },
    // Phase 1 requires login — anonymous enquiries are out of scope.
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
    ownerNotes: { type: String, trim: true }, // private — only center owner sees
  },
  { timestamps: true }
);

enquirySchema.index({ student: 1 });
enquirySchema.index({ coachingCenter: 1, status: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
