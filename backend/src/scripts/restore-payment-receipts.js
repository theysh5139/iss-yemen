import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';
import { PaymentReceipt } from '../models/PaymentReceipt.model.js';
import { User } from '../models/User.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

/**
 * Restore payment receipts data from Event.registrations to paymentreceipts collection
 */
async function restorePaymentReceipts() {
  try {
    console.log('='.repeat(70));
    console.log('RESTORING PAYMENT RECEIPTS TO CLOUD DATABASE');
    console.log('='.repeat(70));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70));

    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    // Find all events with payment receipts in registrations
    const events = await Event.find({
      'registrations.paymentReceipt': { $exists: true, $ne: null }
    }).populate('registrations.user', 'name email');

    console.log(`[INFO] Found ${events.length} events with payment receipts in registrations\n`);

    let receiptsCreated = 0;
    let receiptsSkipped = 0;
    let receiptsErrors = 0;

    // Process each event
    for (const event of events) {
      console.log(`\n[PROCESSING] Event: "${event.title}" (${event.registrations.length} registrations)`);

      for (let index = 0; index < event.registrations.length; index++) {
        const registration = event.registrations[index];
        
        if (!registration.paymentReceipt || !registration.user) {
          continue;
        }

        const receiptData = registration.paymentReceipt;
        
        // Skip if no amount
        if (!receiptData.amount || receiptData.amount === 0) {
          console.log(`  [SKIP] Registration ${index}: No payment amount`);
          receiptsSkipped++;
          continue;
        }

        try {
          // Check if payment receipt already exists
          const existingReceipt = await PaymentReceipt.findOne({
            userId: registration.user,
            eventId: event._id
          });

          if (existingReceipt) {
            console.log(`  [SKIP] Payment receipt already exists for user ${registration.user}`);
            receiptsSkipped++;
            continue;
          }

          // Get user details
          const user = await User.findById(registration.user);
          if (!user) {
            console.log(`  [SKIP] User not found: ${registration.user}`);
            receiptsSkipped++;
            continue;
          }

          // Determine payment type
          let paymentType = 'Event Registration';
          if (event.category === 'Cultural') {
            paymentType = 'Event Registration';
          } else if (event.category === 'Academic') {
            paymentType = 'Event Registration';
          } else if (event.category === 'Social') {
            paymentType = 'Event Registration';
          }

          // Determine currency
          let currency = 'RM';
          if (receiptData.currency) {
            currency = receiptData.currency;
          }

          // Ensure receiptUrl is provided (required field)
          const receiptUrl = receiptData.receiptUrl || `/uploads/receipts/pending-${registration.user}-${event._id}.pdf`;
          
          // Create PaymentReceipt document
          const paymentReceipt = await PaymentReceipt.create({
            userId: registration.user,
            eventId: event._id,
            amount: receiptData.amount,
            currency: currency,
            paymentType: paymentType,
            receiptUrl: receiptUrl,
            paymentStatus: receiptData.paymentStatus || 'Pending',
            verifiedBy: receiptData.verifiedBy || null,
            verifiedAt: receiptData.verifiedAt || null,
            rejectionReason: receiptData.rejectionReason || null,
            submittedAt: receiptData.generatedAt || registration.registeredAt || new Date()
          });

          receiptsCreated++;
          console.log(`  ✓ Created payment receipt: ${user.name || user.email} - RM ${receiptData.amount} - Status: ${paymentReceipt.paymentStatus}`);

        } catch (error) {
          receiptsErrors++;
          console.error(`  ✗ Error creating payment receipt for registration ${index}:`, error.message);
          
          // If it's a duplicate key error, skip it
          if (error.code === 11000) {
            console.log(`    [INFO] Duplicate detected, skipping...`);
            receiptsSkipped++;
            receiptsErrors--;
          }
        }
      }
    }

    // Verify final counts
    const finalCount = await PaymentReceipt.countDocuments();
    const byStatus = {
      Pending: await PaymentReceipt.countDocuments({ paymentStatus: 'Pending' }),
      Verified: await PaymentReceipt.countDocuments({ paymentStatus: 'Verified' }),
      Rejected: await PaymentReceipt.countDocuments({ paymentStatus: 'Rejected' })
    };

    console.log('\n' + '='.repeat(70));
    console.log('RESTORATION SUMMARY');
    console.log('='.repeat(70));
    console.log('Payment Receipts Created:');
    console.log(`  ✓ Created: ${receiptsCreated}`);
    console.log(`  ⊘ Skipped: ${receiptsSkipped}`);
    console.log(`  ✗ Errors: ${receiptsErrors}`);
    console.log('\nFinal Collection Counts:');
    console.log(`  📋 Total Payment Receipts: ${finalCount}`);
    console.log(`  ⏳ Pending: ${byStatus.Pending}`);
    console.log(`  ✅ Verified: ${byStatus.Verified}`);
    console.log(`  ❌ Rejected: ${byStatus.Rejected}`);
    console.log('='.repeat(70));
    console.log('\n✅ Payment receipts restoration completed!');
    console.log('\n💡 Note: Payment receipts are now in the "paymentreceipts" collection.');
    console.log('   Query: db.paymentreceipts.find({})');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Restoration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run restoration
restorePaymentReceipts();

