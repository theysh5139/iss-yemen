import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'MYR' },
    transactionId: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    paymentMethod: { type: String, default: 'online' },
    paymentDate: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed } // Additional payment info
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, eventId: 1 });
// Removed duplicate index - transactionId already has unique: true
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);

