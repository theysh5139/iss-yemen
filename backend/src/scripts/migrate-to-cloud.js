import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Event } from '../models/Event.model.js';
import { Payment } from '../models/Payment.model.js';
import { Receipt } from '../models/Receipt.model.js';
import { User } from '../models/User.model.js';
import { generateRandomToken } from '../utils/tokens.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
const USE_GRIDFS = process.env.USE_GRIDFS === 'true' || process.env.USE_GRIDFS === '1';

// Upload directories
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const IMAGES_DIR = path.join(__dirname, '../uploads/images');
const RECEIPTS_DIR = path.join(__dirname, '../uploads/receipts');
const QR_DIR = path.join(__dirname, '../uploads/qr');

/**
 * Migrate files from filesystem to GridFS
 */
async function migrateFilesToGridFS() {
  if (!USE_GRIDFS) {
    console.log('[SKIP] GridFS not enabled. Set USE_GRIDFS=true to migrate files.');
    console.log('[INFO] Files remain in filesystem and will continue to work.');
    return { images: 0, receipts: 0, qr: 0 };
  }

  console.log('\n[FILE MIGRATION] Starting file migration to GridFS...');
  
  // Dynamically import GridFS utilities
  let uploadToGridFS;
  try {
    const gridfsModule = await import('../utils/gridfs.js');
    uploadToGridFS = gridfsModule.uploadToGridFS;
  } catch (error) {
    console.error('[ERROR] Failed to import GridFS utilities:', error.message);
    console.log('[INFO] Make sure mongodb package is installed: npm install mongodb');
    return { images: 0, receipts: 0, qr: 0 };
  }

  let migrated = { images: 0, receipts: 0, qr: 0 };
  let errors = { images: 0, receipts: 0, qr: 0 };

  // Migrate images
  if (fs.existsSync(IMAGES_DIR)) {
    const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
    );
    
    console.log(`[FILE MIGRATION] Found ${imageFiles.length} image files to migrate`);
    
    for (const filename of imageFiles) {
      try {
        const filePath = path.join(IMAGES_DIR, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const fileId = await uploadToGridFS(fileBuffer, filename, {
          type: 'image',
          originalPath: `/uploads/images/${filename}`
        });
        console.log(`  ✓ Migrated image: ${filename} → GridFS ID: ${fileId}`);
        migrated.images++;
      } catch (error) {
        console.error(`  ✗ Failed to migrate image ${filename}:`, error.message);
        errors.images++;
      }
    }
  }

  // Migrate receipts
  if (fs.existsSync(RECEIPTS_DIR)) {
    const receiptFiles = fs.readdirSync(RECEIPTS_DIR).filter(f => 
      /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(f)
    );
    
    console.log(`[FILE MIGRATION] Found ${receiptFiles.length} receipt files to migrate`);
    
    for (const filename of receiptFiles) {
      try {
        const filePath = path.join(RECEIPTS_DIR, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const fileId = await uploadToGridFS(fileBuffer, filename, {
          type: 'receipt',
          originalPath: `/uploads/receipts/${filename}`
        });
        console.log(`  ✓ Migrated receipt: ${filename} → GridFS ID: ${fileId}`);
        migrated.receipts++;
      } catch (error) {
        console.error(`  ✗ Failed to migrate receipt ${filename}:`, error.message);
        errors.receipts++;
      }
    }
  }

  // Migrate QR codes
  if (fs.existsSync(QR_DIR)) {
    const qrFiles = fs.readdirSync(QR_DIR).filter(f => 
      /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(f)
    );
    
    console.log(`[FILE MIGRATION] Found ${qrFiles.length} QR code files to migrate`);
    
    for (const filename of qrFiles) {
      try {
        const filePath = path.join(QR_DIR, filename);
        const fileBuffer = fs.readFileSync(filePath);
        const fileId = await uploadToGridFS(fileBuffer, filename, {
          type: 'qr',
          originalPath: `/uploads/qr/${filename}`
        });
        console.log(`  ✓ Migrated QR code: ${filename} → GridFS ID: ${fileId}`);
        migrated.qr++;
      } catch (error) {
        console.error(`  ✗ Failed to migrate QR code ${filename}:`, error.message);
        errors.qr++;
      }
    }
  }

  console.log(`[FILE MIGRATION] Completed: ${migrated.images} images, ${migrated.receipts} receipts, ${migrated.qr} QR codes`);
  if (errors.images + errors.receipts + errors.qr > 0) {
    console.log(`[FILE MIGRATION] Errors: ${errors.images} images, ${errors.receipts} receipts, ${errors.qr} QR codes`);
  }

  return migrated;
}

/**
 * Migrate payment/receipt data from Event.registrations to Payment/Receipt collections
 */
async function migratePaymentReceipts() {
  console.log('\n[PAYMENT MIGRATION] Starting payment/receipt data migration...');
  
  let paymentsCreated = 0;
  let receiptsCreated = 0;
  let skipped = 0;
  let errors = 0;

  // Find all events with registrations that have payment receipts
  const events = await Event.find({
    'registrations.paymentReceipt': { $exists: true, $ne: null }
  }).populate('registrations.user', 'name email');

  console.log(`[PAYMENT MIGRATION] Found ${events.length} events with payment receipts`);

  for (const event of events) {
    for (let index = 0; index < event.registrations.length; index++) {
      const registration = event.registrations[index];
      
      if (!registration.paymentReceipt || !registration.user) {
        continue;
      }

      const receiptData = registration.paymentReceipt;
      
      // Skip if amount is 0 or missing
      if (!receiptData.amount || receiptData.amount === 0) {
        skipped++;
        continue;
      }

      try {
        // Check if Payment already exists for this user and event
        const existingPayment = await Payment.findOne({
          userId: registration.user,
          eventId: event._id
        });

        if (existingPayment) {
          console.log(`  [SKIP] Payment already exists for user ${registration.user} and event ${event._id}`);
          skipped++;
          continue;
        }

        // Generate transaction ID if not present
        const transactionId = receiptData.transactionId || `TXN-${Date.now()}-${generateRandomToken(8).toUpperCase()}`;

        // Create Payment document
        const payment = await Payment.create({
          userId: registration.user,
          eventId: event._id,
          amount: receiptData.amount,
          currency: 'MYR',
          transactionId: transactionId,
          status: receiptData.paymentStatus === 'Verified' ? 'paid' : 
                 receiptData.paymentStatus === 'Rejected' ? 'failed' : 'pending',
          paymentMethod: (receiptData.paymentMethod || 'online').toLowerCase().replace(/\s+/g, '_'),
          paymentDate: receiptData.generatedAt || registration.registeredAt || new Date(),
          metadata: {
            registrationIndex: index,
            receiptNumber: receiptData.receiptNumber,
            receiptUrl: receiptData.receiptUrl,
            verifiedAt: receiptData.verifiedAt,
            verifiedBy: receiptData.verifiedBy,
            rejectionReason: receiptData.rejectionReason
          }
        });

        // Create Receipt document
        const user = await User.findById(registration.user);
        const receipt = await Receipt.create({
          receiptId: receiptData.receiptNumber || `REC-${Date.now()}-${generateRandomToken(6).toUpperCase()}`,
          paymentId: payment._id,
          userId: registration.user,
          eventId: event._id,
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transactionId,
          userName: registration.registrationName || user?.name || 'Unknown User',
          eventName: event.title,
          eventDate: event.date,
          paymentDate: payment.paymentDate
        });

        paymentsCreated++;
        receiptsCreated++;
        
        console.log(`  ✓ Created Payment & Receipt for ${user?.name || 'User'} - Event: "${event.title}" - Amount: RM ${receiptData.amount}`);

      } catch (error) {
        console.error(`  ✗ Error migrating payment for event ${event._id}, registration ${index}:`, error.message);
        errors++;
      }
    }
  }

  console.log(`[PAYMENT MIGRATION] Completed:`);
  console.log(`  - Payments created: ${paymentsCreated}`);
  console.log(`  - Receipts created: ${receiptsCreated}`);
  console.log(`  - Skipped: ${skipped}`);
  console.log(`  - Errors: ${errors}`);

  return { paymentsCreated, receiptsCreated, skipped, errors };
}

/**
 * Update Event documents to reference GridFS file IDs (if GridFS is enabled)
 */
async function updateEventFileReferences() {
  if (!USE_GRIDFS) {
    console.log('[SKIP] GridFS not enabled. Skipping file reference updates.');
    return { updated: 0 };
  }

  console.log('\n[FILE REFERENCE UPDATE] Updating event file references...');
  let updated = 0;

  // This would require mapping old file paths to GridFS IDs
  // For now, we'll just log what needs to be updated
  const eventsWithImages = await Event.find({
    $or: [
      { imageUrl: { $exists: true, $ne: null } },
      { qrCodeUrl: { $exists: true, $ne: null } }
    ]
  });

  console.log(`[FILE REFERENCE UPDATE] Found ${eventsWithImages.length} events with file references`);
  console.log(`[FILE REFERENCE UPDATE] Note: File path to GridFS ID mapping would need to be implemented based on your file naming convention`);

  return { updated };
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    console.log('='.repeat(60));
    console.log('MIGRATION TO CLOUD MONGODB');
    console.log('='.repeat(60));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`GridFS Enabled: ${USE_GRIDFS}`);
    console.log('='.repeat(60));

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    // Run migrations
    const fileResults = await migrateFilesToGridFS();
    const paymentResults = await migratePaymentReceipts();
    const fileRefResults = await updateEventFileReferences();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log('Files Migrated to GridFS:');
    console.log(`  - Images: ${fileResults.images}`);
    console.log(`  - Receipts: ${fileResults.receipts}`);
    console.log(`  - QR Codes: ${fileResults.qr}`);
    console.log('\nPayment/Receipt Data:');
    console.log(`  - Payments created: ${paymentResults.paymentsCreated}`);
    console.log(`  - Receipts created: ${paymentResults.receiptsCreated}`);
    console.log(`  - Skipped: ${paymentResults.skipped}`);
    console.log(`  - Errors: ${paymentResults.errors}`);
    console.log('\nFile References Updated:');
    console.log(`  - Events updated: ${fileRefResults.updated}`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
runMigration();

