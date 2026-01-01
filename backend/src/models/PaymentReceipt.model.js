import mongoose from 'mongoose';

const paymentReceiptSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    eventId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Event', 
      required: true,
      index: true
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0
    },
    currency: { 
      type: String, 
      default: 'RM',
      enum: ['RM', 'USD', 'YER']
    },
    paymentType: { 
      type: String, 
      required: true,
      enum: ['Event Registration', 'Membership Fee', 'Donation', 'Other']
    },
    receiptUrl: { 
      type: String, 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ['Pending', 'Verified', 'Rejected'], 
      default: 'Pending',
      index: true
    },
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    verifiedAt: { 
      type: Date 
    },
    rejectionReason: { 
      type: String 
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate payment submissions
paymentReceiptSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Index for efficient queries
paymentReceiptSchema.index({ paymentStatus: 1, createdAt: -1 });

export const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);


