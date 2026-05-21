const mongoose = require("mongoose");

// Basic email validation regex (RFC 5322 simplified — good enough for app-level validation).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // not returned by default
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["student", "owner", "admin"],
      default: "student",
    },
    profileImage: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// `email` already has unique via field option; explicit index on role for admin queries.
userSchema.index({ role: 1 });

// NOTE: bcrypt pre-save hashing hook is intentionally deferred to Phase 2
// (added with /auth/register and /auth/login endpoints).

module.exports = mongoose.model("User", userSchema);
