import { Payment } from '../models/Payment.model.js';
import { Receipt } from '../models/Receipt.model.js';
import { Event } from '../models/Event.model.js';
import { User } from '../models/User.model.js';
import { generateReceiptNumber } from '../utils/receipt.js';
import { generateReceiptPDF } from '../utils/pdfGenerator.js';
import { generateRandomToken } from '../utils/tokens.js';

/**
 * U21 & U22: Create payment and automatically generate proof of payment and receipt
 * This endpoint is called after successful event registration payment
 */
export async function createPayment(req, res, next) {
  try {
    const { eventId, amount, paymentMethod = 'online' } = req.body;
    const userId = req.user?.userId || req.user?._id;
    
    if (!eventId || !amount) {
      return res.status(400).json({ message: 'Event ID and amount are required' });
    }
    
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${generateRandomToken(8).toUpperCase()}`;
    
    // U21: Create payment record (proof of payment)
    const payment = await Payment.create({
      userId,
      eventId,
      amount: parseFloat(amount),
      currency: 'MYR',
      transactionId,
      status: 'paid', // In production, this might start as 'pending' until payment gateway confirms
      paymentMethod,
      paymentDate: new Date()
    });
    
    // U21: Automatically generate proof of payment (receipt record)
    const receiptId = generateReceiptNumber();
    const receipt = await Receipt.create({
      receiptId,
      paymentId: payment._id,
      userId,
      eventId,
      amount: payment.amount,
      currency: payment.currency,
      transactionId: payment.transactionId,
      userName: user.name || user.email,
      eventName: event.title,
      eventDate: event.date,
      paymentDate: payment.paymentDate
    });
    
    // U22: Automatically generate PDF receipt
    const pdfBuffer = await generateReceiptPDF({
      receiptId: receipt.receiptId,
      userName: receipt.userName,
      eventName: receipt.eventName,
      eventDate: receipt.eventDate,
      paymentDate: receipt.paymentDate,
      amount: receipt.amount,
      currency: receipt.currency,
      transactionId: receipt.transactionId
    });
    
    // Mark receipt as generated
    receipt.pdfGeneratedAt = new Date();
    await receipt.save();
    
    // Return success response with receipt info
    res.status(201).json({
      message: 'Payment successful. Receipt generated automatically.',
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentDate: payment.paymentDate
      },
      receipt: {
        id: receipt._id,
        receiptId: receipt.receiptId,
        pdfGenerated: true,
        pdfGeneratedAt: receipt.pdfGeneratedAt
      },
      // Include PDF as base64 for immediate download (optional)
      pdfBase64: pdfBuffer.toString('base64')
    });
    
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment proof/receipt by payment ID
 */
export async function getPaymentProof(req, res, next) {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.userId || req.user?._id;
    
    const payment = await Payment.findById(paymentId)
      .populate('eventId', 'title date')
      .populate('userId', 'name email');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Verify ownership (unless admin)
    if (payment.userId._id.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get associated receipt
    const receipt = await Receipt.findOne({ paymentId: payment._id });
    
    res.json({
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentDate: payment.paymentDate,
        event: {
          id: payment.eventId._id,
          name: payment.eventId.title,
          date: payment.eventId.date
        },
        user: {
          id: payment.userId._id,
          name: payment.userId.name || payment.userId.email
        }
      },
      receipt: receipt ? {
        id: receipt._id,
        receiptId: receipt.receiptId,
        pdfGenerated: !!receipt.pdfGeneratedAt
      } : null
    });
    
  } catch (error) {
    next(error);
  }
}

/**
 * Download receipt PDF
 */
export async function downloadReceipt(req, res, next) {
  try {
    const { receiptId } = req.params;
    const userId = req.user?.userId || req.user?._id;
    
    const receipt = await Receipt.findOne({ 
      $or: [
        { _id: receiptId },
        { receiptId: receiptId }
      ]
    }).populate('eventId');
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Verify ownership (unless admin)
    if (receipt.userId.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Generate PDF
    const pdfBuffer = await generateReceiptPDF({
      receiptId: receipt.receiptId,
      userName: receipt.userName,
      eventName: receipt.eventName,
      eventDate: receipt.eventDate,
      paymentDate: receipt.paymentDate,
      amount: receipt.amount,
      currency: receipt.currency,
      transactionId: receipt.transactionId
    });
    
    // Set headers for PDF download
    const fileName = `Receipt-${receipt.receiptId}-${receipt.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's receipts
 */
export async function getUserReceipts(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?._id;
    
    const receipts = await Receipt.find({ userId })
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      receipts: receipts.map(r => ({
        id: r._id,
        receiptId: r.receiptId,
        eventName: r.eventName,
        eventDate: r.eventDate,
        amount: r.amount,
        currency: r.currency,
        paymentDate: r.paymentDate,
        transactionId: r.transactionId,
        pdfGenerated: !!r.pdfGeneratedAt
      }))
    });
    
  } catch (error) {
    next(error);
  }
}

