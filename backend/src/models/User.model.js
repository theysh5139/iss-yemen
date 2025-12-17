import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    emailVerifiedAt: { type: Date },
    emailVerificationTokenHash: { type: String },
    emailVerificationTokenExpiresAt: { type: Date },
    passwordResetTokenHash: { type: String },
    passwordResetTokenExpiresAt: { type: Date },
    role: { type: String, enum: ['visitor', 'member', 'admin'], default: 'visitor' },
    mfaOtpHash: { type: String },
    mfaOtpExpiresAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.methods.isEmailVerified = function () {
  return Boolean(this.emailVerifiedAt);
};

export const User = mongoose.model('User', userSchema);


