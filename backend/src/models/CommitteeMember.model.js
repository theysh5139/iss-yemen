import mongoose from 'mongoose';

const committeeMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    committeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Committee', 
      required: true 
    },
    photo: { type: String, required: true }, // URL or path to image
    order: { type: Number, default: 0 } // For display ordering within committee
  },
  { timestamps: true }
);

// Indexes for efficient queries
committeeMemberSchema.index({ committeeId: 1, order: 1 });
committeeMemberSchema.index({ committeeId: 1 });

export const CommitteeMember = mongoose.model('CommitteeMember', committeeMemberSchema);
