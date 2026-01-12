import mongoose from 'mongoose';

const executiveCommitteeMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { 
      type: String, 
      enum: ['President', 'VP', 'General Secretary', 'Treasurer'], 
      required: true 
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    photo: { type: String, required: true }, // URL or path to image
    committeeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Committee', 
      required: true 
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
executiveCommitteeMemberSchema.index({ committeeId: 1 });
executiveCommitteeMemberSchema.index({ role: 1 });

export const ExecutiveCommitteeMember = mongoose.model('ExecutiveCommitteeMember', executiveCommitteeMemberSchema);
