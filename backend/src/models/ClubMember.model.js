import mongoose from 'mongoose';

const clubMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true }, // e.g., "President", "Vice President", "Secretary", "Treasurer", etc.
    photo: { type: String, required: true }, // URL or path to image
    order: { type: Number, default: 0 }, // For ordering club members
    email: { type: String, trim: true }, // Optional email
    bio: { type: String, trim: true }, // Optional bio/description
    isActive: { type: Boolean, default: true } // To mark inactive members
  },
  { timestamps: true, collection: 'committee' }
);

export const ClubMember = mongoose.model('ClubMember', clubMemberSchema);
