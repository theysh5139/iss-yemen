import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registeredAt: { type: Date, default: Date.now },
  registrationName: { type: String }, // Name used during registration
  registrationEmail: { type: String }, // Email used during registration
  matricNumber: { type: String }, // Matric number from registration form
  phone: { type: String }, // Phone number from registration form
  notes: { type: String }, // Additional notes from registration form
    paymentReceipt: {
      receiptNumber: { type: String },
      receiptUrl: { type: String }, // URL to uploaded receipt PDF file
      generatedAt: { type: Date },
      amount: { type: Number },
      paymentMethod: { type: String },
      paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Verified', 'Rejected'], 
        default: 'Pending' 
      },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String }, // Reason for rejection if payment is rejected
      officialReceiptGenerated: { type: Boolean, default: false }, // Flag to prevent regeneration
      officialReceiptGeneratedAt: { type: Date }, // Timestamp when official receipt was generated
      transactionId: { type: String } // Transaction ID for receipt
    }
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    category: { type: String, enum: ['News', 'Announcement', 'Activity', 'Cultural', 'Academic', 'Social'], required: true },
    type: { type: String, enum: ['event', 'announcement', 'activity'], default: 'event' },
    price: { type: Number, default: 0 }, // Event registration fee
    fee: { type: Number, default: 0 }, // Alternative fee field for compatibility
    qrCodeUrl: { type: String }, // URL to QR code for payment
    imageUrl: { type: String }, // URL to image for news/announcements/activities
    maxAttendees: { type: Number },
    attendees: { type: Number, default: 0 },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    registrations: [registrationSchema], // Detailed registration with payment info
    schedule: { type: String }, // For recurring activities like "Every Wednesday, 8:00 PM"
    isRecurring: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true }, // Public events visible to non-logged-in users, private only to members
    cancelled: { type: Boolean, default: false }, // For cancelled events
    isActive: { type: Boolean, default: true },
    registrationOpen: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requiresPayment: { type: Boolean, default: false },
    paymentAmount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Index for efficient queries
eventSchema.index({ date: -1 });
eventSchema.index({ category: 1 });
eventSchema.index({ type: 1 });
export const Event = mongoose.model('Event', eventSchema);

