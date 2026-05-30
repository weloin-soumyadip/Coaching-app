import { Schema, model, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';

const WEBINAR_STATUSES = ['scheduled', 'live', 'completed', 'cancelled'] as const;

const webinarSchema = new Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    // Teacher who hosts the webinar — owner for CRUD authorization.
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    description: { type: String, trim: true },
    scheduledAt: { type: Date, required: [true, 'scheduledAt is required'] },
    durationMinutes: { type: Number, min: 0 },
    thumbnail: { type: String, default: '' },
    // Link surfaced by the dashboard "Join / View Details" button.
    joinUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: WEBINAR_STATUSES,
      default: 'scheduled',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Time-window lookups (dashboard "next 2 days") and per-teacher listings.
webinarSchema.index({ scheduledAt: 1 });
webinarSchema.index({ status: 1, scheduledAt: 1 });
webinarSchema.index({ teacher: 1, scheduledAt: 1 });

export type WebinarAttrs = InferSchemaType<typeof webinarSchema>;
export type WebinarDoc = HydratedDocument<WebinarAttrs>;
export type WebinarModel = Model<WebinarAttrs>;

const Webinar: WebinarModel = model<WebinarAttrs>('Webinar', webinarSchema);
export default Webinar;
