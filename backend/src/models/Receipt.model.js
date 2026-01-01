import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema(
  {
    receiptId: { type: String, required: true, unique: true }, // Human-readable receipt ID
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    // Receipt details
    userName: { type: String, required: true },
    eventName: { type: String, required: true },
    eventDate: { type: Date, required: true },
    paymentDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'MYR' },
    transactionId: { type: String, required: true },
    // PDF storage reference
    pdfGeneratedAt: { type: Date },
    pdfPath: { type: String } // Path to stored PDF file (optional, can generate on-demand)
  },
  { timestamps: true }
);

receiptSchema.index({ userId: 1 });
// Removed duplicate indexes - receiptId and paymentId already have unique: true

export const Receipt = mongoose.model('Receipt', receiptSchema);

