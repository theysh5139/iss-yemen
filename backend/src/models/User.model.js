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
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
    isActive: { type: Boolean, default: true },
    // MFA/OTP fields
    otp: { type: String }, // Hashed OTP
    otpExpires: { type: Date },
    failedOtpAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date } // Lockout timestamp after 3 failed attempts
  },
  { timestamps: true }
);

userSchema.methods.isEmailVerified = function () {
  return Boolean(this.emailVerifiedAt);
};

export const User = mongoose.model('User', userSchema);


