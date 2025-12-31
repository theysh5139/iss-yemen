import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    location: { type: String, trim: true },
    category: { type: String, trim: true },
    price: { type: Number, default: 0 }, // Event registration fee
    maxAttendees: { type: Number },
    currentAttendees: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    registrationOpen: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);

