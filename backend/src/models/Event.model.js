import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    category: { type: String, enum: ['News', 'Announcement', 'Activity', 'Cultural', 'Academic', 'Social'], required: true },
    type: { type: String, enum: ['event', 'announcement', 'activity'], default: 'event' },
    attendees: { type: Number, default: 0 },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    schedule: { type: String }, // For recurring activities like "Every Wednesday, 8:00 PM"
    isRecurring: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true }, // Public events visible to visitors, private only to members
    cancelled: { type: Boolean, default: false } // For cancelled events
  },
  { timestamps: true }
);

// Index for efficient queries
eventSchema.index({ date: -1 });
eventSchema.index({ category: 1 });
eventSchema.index({ type: 1 });

export const Event = mongoose.model('Event', eventSchema);

