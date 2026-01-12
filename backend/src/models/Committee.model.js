import mongoose from 'mongoose';

const committeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    priority: { type: Number, default: null } // Optional, lower = higher priority
  },
  { timestamps: true }
);

// Index for efficient queries
committeeSchema.index({ priority: 1 });
committeeSchema.index({ name: 1 });

export const Committee = mongoose.model('Committee', committeeSchema);
