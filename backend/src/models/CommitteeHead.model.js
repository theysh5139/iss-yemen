import mongoose from 'mongoose';

const committeeHeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    committeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Committee', 
      required: true 
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    photo: { type: String, required: true } // URL or path to image
  },
  { timestamps: true }
);

// Indexes for efficient queries
committeeHeadSchema.index({ committeeId: 1 });

// Ensure one head per committee (optional constraint)
committeeHeadSchema.index({ committeeId: 1 }, { unique: false });

export const CommitteeHead = mongoose.model('CommitteeHead', committeeHeadSchema);
