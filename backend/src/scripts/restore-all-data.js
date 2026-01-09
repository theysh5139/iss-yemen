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
import { AboutUs } from '../models/AboutUs.model.js';
import ChatRule from '../models/ChatRule.model.js';
import { HOD } from '../models/HOD.model.js';
import { generateRandomToken } from '../utils/tokens.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
const USE_GRIDFS = process.env.USE_GRIDFS === 'true' || process.env.USE_GRIDFS === '1';
const BACKUP_DIR = path.join(__dirname, '../../db_backup/iss_yemen_club');

/**
 * Check if BSON backup files exist
 */
function checkBackupFiles() {
  const backupFiles = {
    events: path.join(BACKUP_DIR, 'events.bson'),
    users: path.join(BACKUP_DIR, 'users.bson'),
    aboutus: path.join(BACKUP_DIR, 'aboutus.bson'),
    chatrules: path.join(BACKUP_DIR, 'chatrules.bson'),
    hods: path.join(BACKUP_DIR, 'hods.bson'),
    payments: path.join(BACKUP_DIR, 'payments.bson'),
    receipts: path.join(BACKUP_DIR, 'receipts.bson'),
    paymentreceipts: path.join(BACKUP_DIR, 'paymentreceipts.bson'),
    emailconfigs: path.join(BACKUP_DIR, 'emailconfigs.bson')
  };

  const existing = {};
  for (const [key, filePath] of Object.entries(backupFiles)) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      existing[key] = {
        path: filePath,
        size: stats.size,
        exists: true
      };
    } else {
      existing[key] = { exists: false };
    }
  }

  return existing;
}

/**
 * Restore from local database (if different from cloud)
 */
async function restoreFromLocalDB() {
  const LOCAL_MONGO_URI = process.env.LOCAL_MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
  
  // If local and cloud are the same, skip
  if (LOCAL_MONGO_URI === MONGO_URI) {
    console.log('[SKIP] Local and cloud MongoDB URIs are the same. Skipping local DB restore.');
    return { events: 0, users: 0, announcements: 0, news: 0 };
  }

  console.log('\n[LOCAL DB RESTORE] Attempting to restore from local database...');
  console.log(`Local URI: ${LOCAL_MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);

  try {
    // Connect to local database
    const localConnection = await mongoose.createConnection(LOCAL_MONGO_URI).asPromise();
    
    const LocalEvent = localConnection.model('Event', Event.schema);
    const LocalUser = localConnection.model('User', User.schema);
    
    // Get all events (including news and announcements)
    const localEvents = await LocalEvent.find({}).lean();
    const localUsers = await LocalUser.find({}).lean();
    
    console.log(`[LOCAL DB] Found ${localEvents.length} events and ${localUsers.length} users in local DB`);
    
    // Count and separate by type
    const newsCount = localEvents.filter(e => e.type === 'event' && e.category === 'News').length;
    const announcementCount = localEvents.filter(e => e.type === 'announcement').length;
    const activityCount = localEvents.filter(e => e.type === 'activity').length;
    const eventCount = localEvents.filter(e => e.type === 'event' && e.category !== 'News').length;
    
    console.log(`[LOCAL DB] Breakdown (SEPARATED):`);
    console.log(`  📅 Events: ${eventCount}`);
    console.log(`  📰 News: ${newsCount}`);
    console.log(`  📢 Announcements: ${announcementCount}`);
    console.log(`  🎯 Activities: ${activityCount}`);
    
    // Restore events (including news and announcements)
    // Check if separate collections exist
    const db = mongoose.connection.db;
    const hasNewsCollection = (await db.listCollections({ name: 'news' }).toArray()).length > 0;
    const hasAnnouncementsCollection = (await db.listCollections({ name: 'announcements' }).toArray()).length > 0;
    const hasActivitiesCollection = (await db.listCollections({ name: 'activities' }).toArray()).length > 0;
    
    const useSeparateCollections = hasNewsCollection || hasAnnouncementsCollection || hasActivitiesCollection;
    
    if (useSeparateCollections) {
      console.log('[INFO] Separate collections detected. Migrating to news, announcements, and activities collections...');
    }

    let eventsRestored = 0;
    let newsRestored = 0;
    let announcementsRestored = 0;
    let activitiesRestored = 0;
    let eventsSkipped = 0;
    
    for (const localEvent of localEvents) {
      try {
        // Determine type and target collection
        let targetCollection = null;
        let eventType = 'Event';
        let icon = '📅';
        
        if (localEvent.type === 'event' && localEvent.category === 'News') {
          eventType = 'News';
          icon = '📰';
          if (useSeparateCollections) {
            targetCollection = db.collection('news');
          }
        } else if (localEvent.type === 'announcement') {
          eventType = 'Announcement';
          icon = '📢';
          if (useSeparateCollections) {
            targetCollection = db.collection('announcements');
          }
        } else if (localEvent.type === 'activity') {
          eventType = 'Activity';
          icon = '🎯';
          if (useSeparateCollections) {
            targetCollection = db.collection('activities');
          }
        }

        // Check if already exists
        let existing = null;
        if (targetCollection) {
          existing = await targetCollection.findOne({ _id: localEvent._id });
        } else {
          existing = await Event.findOne({ _id: localEvent._id });
        }
        
        if (existing) {
          eventsSkipped++;
          continue;
        }
        
        // Insert into appropriate collection
        if (targetCollection) {
          await targetCollection.insertOne(localEvent);
          if (eventType === 'News') newsRestored++;
          else if (eventType === 'Announcement') announcementsRestored++;
          else if (eventType === 'Activity') activitiesRestored++;
        } else {
          await Event.create(localEvent);
          eventsRestored++;
        }
        
        console.log(`  ${icon} Restored ${eventType}: "${localEvent.title}"`);
      } catch (error) {
        console.error(`  ✗ Failed to restore event "${localEvent.title}":`, error.message);
      }
    }
    
    // Restore users
    let usersRestored = 0;
    let usersSkipped = 0;
    
    for (const localUser of localUsers) {
      try {
        const existing = await User.findOne({ _id: localUser._id });
        if (existing) {
          usersSkipped++;
          continue;
        }
        
        await User.create(localUser);
        usersRestored++;
        console.log(`  ✓ Restored user: ${localUser.email}`);
      } catch (error) {
        console.error(`  ✗ Failed to restore user ${localUser.email}:`, error.message);
      }
    }
    
    await localConnection.close();
    
    console.log(`[LOCAL DB RESTORE] Completed:`);
    console.log(`  - Events restored: ${eventsRestored} (${eventsSkipped} skipped)`);
    console.log(`  - News restored: ${newsRestored}`);
    console.log(`  - Announcements restored: ${announcementsRestored}`);
    console.log(`  - Activities restored: ${activitiesRestored}`);
    console.log(`  - Users restored: ${usersRestored} (${usersSkipped} skipped)`);
    
    return {
      events: eventsRestored,
      users: usersRestored,
      announcements: announcementsRestored,
      news: newsRestored,
      activities: activitiesRestored
    };
  } catch (error) {
    console.error('[LOCAL DB RESTORE] Error:', error.message);
    console.log('[INFO] Make sure local MongoDB is running and accessible');
    return { events: 0, users: 0, announcements: 0, news: 0 };
  }
}

/**
 * Verify all data types in cloud database (separated collections)
 */
async function verifyCloudData() {
  console.log('\n[VERIFICATION] Verifying data in cloud database...');
  
  const db = mongoose.connection.db;
  
  // Check if separate collections exist
  const hasNewsCollection = (await db.listCollections({ name: 'news' }).toArray()).length > 0;
  const hasAnnouncementsCollection = (await db.listCollections({ name: 'announcements' }).toArray()).length > 0;
  const hasActivitiesCollection = (await db.listCollections({ name: 'activities' }).toArray()).length > 0;
  
  const useSeparateCollections = hasNewsCollection || hasAnnouncementsCollection || hasActivitiesCollection;
  
  if (useSeparateCollections) {
    console.log('[INFO] Separate collections detected: news, announcements, activities\n');
    
    // Get counts from separate collections
    const [events, news, announcements, activities, users, payments, receipts, aboutus, chatrules, hods] = await Promise.all([
      Event.countDocuments({}),
      hasNewsCollection ? db.collection('news').countDocuments() : 0,
      hasAnnouncementsCollection ? db.collection('announcements').countDocuments() : 0,
      hasActivitiesCollection ? db.collection('activities').countDocuments() : 0,
      User.countDocuments(),
      Payment.countDocuments(),
      Receipt.countDocuments(),
      AboutUs.countDocuments(),
      ChatRule.countDocuments(),
      HOD.countDocuments()
    ]);
    
    const counts = {
      events,
      news,
      announcements,
      activities,
      users,
      payments,
      receipts,
      aboutus,
      chatrules,
      hods
    };
    
    console.log('[VERIFICATION] Current cloud database counts (SEPARATE COLLECTIONS):');
    console.log('─'.repeat(50));
    console.log('📅 EVENTS collection:');
    console.log(`   Count: ${counts.events}`);
    console.log(`   Query: db.events.find({})`);
    
    console.log('\n📰 NEWS collection:');
    console.log(`   Count: ${counts.news}`);
    console.log(`   Query: db.news.find({})`);
    
    console.log('\n📢 ANNOUNCEMENTS collection:');
    console.log(`   Count: ${counts.announcements}`);
    console.log(`   Query: db.announcements.find({})`);
    
    console.log('\n🎯 ACTIVITIES collection:');
    console.log(`   Count: ${counts.activities}`);
    console.log(`   Query: db.activities.find({})`);
    
    console.log('\n👥 OTHER COLLECTIONS:');
    console.log(`   - Users: ${counts.users}`);
    console.log(`   - Payments: ${counts.payments}`);
    console.log(`   - Receipts: ${counts.receipts}`);
    console.log(`   - About Us: ${counts.aboutus}`);
    console.log(`   - Chat Rules: ${counts.chatrules}`);
    console.log(`   - HODs: ${counts.hods}`);
    console.log('─'.repeat(50));
    
    return counts;
  } else {
    console.log('[INFO] Using single "events" collection (separated by type/category)\n');
    
    // Get detailed counts with separation from events collection
    const [events, news, announcements, activities, users, payments, receipts, aboutus, chatrules, hods] = await Promise.all([
      Event.countDocuments({ type: 'event', category: { $ne: 'News' } }),
      Event.countDocuments({ type: 'event', category: 'News' }),
      Event.countDocuments({ type: 'announcement' }),
      Event.countDocuments({ type: 'activity' }),
      User.countDocuments(),
      Payment.countDocuments(),
      Receipt.countDocuments(),
      AboutUs.countDocuments(),
      ChatRule.countDocuments(),
      HOD.countDocuments()
    ]);
    
    const counts = {
      events,
      news,
      announcements,
      activities,
      users,
      payments,
      receipts,
      aboutus,
      chatrules,
      hods
    };
    
    console.log('[VERIFICATION] Current cloud database counts (SINGLE COLLECTION):');
    console.log('─'.repeat(50));
    console.log('📅 EVENTS (type: "event", category: NOT "News"):');
    console.log(`   Count: ${counts.events}`);
    console.log(`   Query: db.events.find({ type: "event", category: { $ne: "News" } })`);
    
    console.log('\n📰 NEWS (type: "event", category: "News"):');
    console.log(`   Count: ${counts.news}`);
    console.log(`   Query: db.events.find({ type: "event", category: "News" })`);
    
    console.log('\n📢 ANNOUNCEMENTS (type: "announcement"):');
    console.log(`   Count: ${counts.announcements}`);
    console.log(`   Query: db.events.find({ type: "announcement" })`);
    
    console.log('\n🎯 ACTIVITIES (type: "activity"):');
    console.log(`   Count: ${counts.activities}`);
    console.log(`   Query: db.events.find({ type: "activity" })`);
    
    console.log('\n👥 OTHER COLLECTIONS:');
    console.log(`   - Users: ${counts.users}`);
    console.log(`   - Payments: ${counts.payments}`);
    console.log(`   - Receipts: ${counts.receipts}`);
    console.log(`   - About Us: ${counts.aboutus}`);
    console.log(`   - Chat Rules: ${counts.chatrules}`);
    console.log(`   - HODs: ${counts.hods}`);
    console.log('─'.repeat(50));
    
    return counts;
  }
}

/**
 * Migrate payment/receipt data from Event.registrations
 */
async function migratePaymentReceipts() {
  console.log('\n[PAYMENT MIGRATION] Migrating payment/receipt data...');
  
  let paymentsCreated = 0;
  let receiptsCreated = 0;
  let skipped = 0;
  let errors = 0;

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
      
      if (!receiptData.amount || receiptData.amount === 0) {
        skipped++;
        continue;
      }

      try {
        const existingPayment = await Payment.findOne({
          userId: registration.user,
          eventId: event._id
        });

        if (existingPayment) {
          skipped++;
          continue;
        }

        const transactionId = receiptData.transactionId || `TXN-${Date.now()}-${generateRandomToken(8).toUpperCase()}`;

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
      } catch (error) {
        console.error(`  ✗ Error migrating payment:`, error.message);
        errors++;
      }
    }
  }

  console.log(`[PAYMENT MIGRATION] Completed: ${paymentsCreated} payments, ${receiptsCreated} receipts`);
  return { paymentsCreated, receiptsCreated, skipped, errors };
}

/**
 * Migrate files to GridFS (if enabled)
 */
async function migrateFilesToGridFS() {
  if (!USE_GRIDFS) {
    console.log('[SKIP] GridFS not enabled. Files remain in filesystem.');
    return { images: 0, receipts: 0, qr: 0 };
  }

  console.log('\n[FILE MIGRATION] Migrating files to GridFS...');
  
  let uploadToGridFS;
  try {
    const gridfsModule = await import('../utils/gridfs.js');
    uploadToGridFS = gridfsModule.uploadToGridFS;
  } catch (error) {
    console.error('[ERROR] GridFS not available:', error.message);
    return { images: 0, receipts: 0, qr: 0 };
  }

  const IMAGES_DIR = path.join(__dirname, '../uploads/images');
  const RECEIPTS_DIR = path.join(__dirname, '../uploads/receipts');
  const QR_DIR = path.join(__dirname, '../uploads/qr');

  let migrated = { images: 0, receipts: 0, qr: 0 };
  let errors = { images: 0, receipts: 0, qr: 0 };

  // Migrate images
  if (fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    for (const filename of files) {
      try {
        const fileBuffer = fs.readFileSync(path.join(IMAGES_DIR, filename));
        await uploadToGridFS(fileBuffer, filename, { type: 'image', originalPath: `/uploads/images/${filename}` });
        migrated.images++;
      } catch (error) {
        errors.images++;
      }
    }
  }

  // Migrate receipts
  if (fs.existsSync(RECEIPTS_DIR)) {
    const files = fs.readdirSync(RECEIPTS_DIR).filter(f => /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(f));
    for (const filename of files) {
      try {
        const fileBuffer = fs.readFileSync(path.join(RECEIPTS_DIR, filename));
        await uploadToGridFS(fileBuffer, filename, { type: 'receipt', originalPath: `/uploads/receipts/${filename}` });
        migrated.receipts++;
      } catch (error) {
        errors.receipts++;
      }
    }
  }

  // Migrate QR codes
  if (fs.existsSync(QR_DIR)) {
    const files = fs.readdirSync(QR_DIR).filter(f => /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(f));
    for (const filename of files) {
      try {
        const fileBuffer = fs.readFileSync(path.join(QR_DIR, filename));
        await uploadToGridFS(fileBuffer, filename, { type: 'qr', originalPath: `/uploads/qr/${filename}` });
        migrated.qr++;
      } catch (error) {
        errors.qr++;
      }
    }
  }

  console.log(`[FILE MIGRATION] Completed: ${migrated.images} images, ${migrated.receipts} receipts, ${migrated.qr} QR codes`);
  return migrated;
}

/**
 * Main restore function
 */
async function runRestore() {
  try {
    console.log('='.repeat(70));
    console.log('COMPREHENSIVE DATA RESTORE TO CLOUD MONGODB');
    console.log('='.repeat(70));
    console.log(`Cloud MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`GridFS Enabled: ${USE_GRIDFS}`);
    console.log('='.repeat(70));

    // Check backup files
    const backupFiles = checkBackupFiles();
    const hasBackup = Object.values(backupFiles).some(f => f.exists);
    
    if (hasBackup) {
      console.log('\n[BACKUP FILES] Found backup files in db_backup/iss_yemen_club/');
      console.log('[INFO] To restore from BSON files, use mongorestore command:');
      console.log('  mongorestore --uri="YOUR_MONGO_URI" --db=iss_yemen_club db_backup/iss_yemen_club/');
      console.log('[INFO] Continuing with other restore methods...\n');
    }

    // Connect to cloud MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to cloud MongoDB\n');

    // Verify current state
    const beforeCounts = await verifyCloudData();

    // Restore from local database (separated by type)
    const localRestore = await restoreFromLocalDB();

    // Migrate payment/receipt data
    const paymentResults = await migratePaymentReceipts();

    // Migrate files
    const fileResults = await migrateFilesToGridFS();

    // Verify final state
    const afterCounts = await verifyCloudData();

    // Summary (with separated data types)
    console.log('\n' + '='.repeat(70));
    console.log('RESTORE SUMMARY (DATA TYPES SEPARATED)');
    console.log('='.repeat(70));
    console.log('📊 Data Restored:');
    console.log(`  📅 Events: ${localRestore.events}`);
    console.log(`  📰 News: ${localRestore.news}`);
    console.log(`  📢 Announcements: ${localRestore.announcements}`);
    console.log(`  👥 Users: ${localRestore.users}`);
    console.log(`  💰 Payments: ${paymentResults.paymentsCreated}`);
    console.log(`  🧾 Receipts: ${paymentResults.receiptsCreated}`);
    console.log('\n📁 Files Migrated:');
    console.log(`  - Images: ${fileResults.images}`);
    console.log(`  - Receipts: ${fileResults.receipts}`);
    console.log(`  - QR Codes: ${fileResults.qr}`);
    console.log('\n📈 Final Database Counts (SEPARATED):');
    console.log('─'.repeat(50));
    console.log(`  📅 Events: ${afterCounts.events} (was ${beforeCounts.events})`);
    console.log(`  📰 News: ${afterCounts.news} (was ${beforeCounts.news})`);
    console.log(`  📢 Announcements: ${afterCounts.announcements} (was ${beforeCounts.announcements})`);
    console.log(`  🎯 Activities: ${afterCounts.activities} (was ${beforeCounts.activities})`);
    console.log(`  👥 Users: ${afterCounts.users} (was ${beforeCounts.users})`);
    console.log(`  💰 Payments: ${afterCounts.payments} (was ${beforeCounts.payments})`);
    console.log(`  🧾 Receipts: ${afterCounts.receipts} (was ${beforeCounts.receipts})`);
    console.log('─'.repeat(50));
    console.log('\n💡 Note: All data types are stored in "events" collection');
    console.log('   but separated by type and category fields.');
    console.log('   Use the queries shown in verification to access each type.');
    console.log('='.repeat(70));
    console.log('\n✅ Restore completed!');

    if (hasBackup) {
      console.log('\n⚠️  NOTE: BSON backup files found. For complete restore, run:');
      console.log('   mongorestore --uri="YOUR_MONGO_URI" --db=iss_yemen_club db_backup/iss_yemen_club/');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Restore failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run restore
runRestore();

