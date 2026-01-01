import mongoose from 'mongoose';

const emailConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['gmail', 'smtp'],
      required: true,
      default: 'gmail'
    },
    // Gmail configuration
    gmailUser: {
      type: String,
      trim: true
    },
    gmailAppPassword: {
      type: String,
      trim: true
    },
    // SMTP configuration
    smtpHost: {
      type: String,
      trim: true
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    smtpSecure: {
      type: Boolean,
      default: false
    },
    smtpUser: {
      type: String,
      trim: true
    },
    smtpPass: {
      type: String,
      trim: true
    },
    smtpFrom: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Ensure only one email config exists
emailConfigSchema.statics.getActiveConfig = async function() {
  return this.findOne({ isActive: true });
};

emailConfigSchema.statics.setActiveConfig = async function(configId) {
  // Deactivate all configs
  await this.updateMany({}, { isActive: false });
  // Activate the specified config
  return this.findByIdAndUpdate(configId, { isActive: true }, { new: true });
};

export const EmailConfig = mongoose.model('EmailConfig', emailConfigSchema);






