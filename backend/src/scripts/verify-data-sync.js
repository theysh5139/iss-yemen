import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';
import { User } from '../models/User.model.js';
import { HOD } from '../models/HOD.model.js';
import { Payment } from '../models/Payment.model.js';
import { Receipt } from '../models/Receipt.model.js';
import ChatRule from '../models/ChatRule.model.js';
import { AboutUs } from '../models/AboutUs.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

/**
 * Verify data synchronization between server operations and database
 */
async function verifyDataSync() {
  try {
    console.log('='.repeat(70));
    console.log('VERIFYING DATA SYNCHRONIZATION');
    console.log('='.repeat(70));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70));

    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const results = {
      collections: {},
      issues: [],
      recommendations: []
    };

    // Check all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('[COLLECTIONS FOUND]');
    console.log('─'.repeat(50));
    console.log(`Total collections: ${collectionNames.length}`);
    console.log(`Collections: ${collectionNames.join(', ')}\n`);

    // 1. Verify Events/News/Announcements/Activities
    console.log('[1] VERIFYING EVENTS, NEWS, ANNOUNCEMENTS, ACTIVITIES');
    console.log('─'.repeat(50));
    
    const eventCount = await Event.countDocuments();
    const eventNews = await Event.countDocuments({ type: 'event', category: 'News' });
    const eventAnnouncements = await Event.countDocuments({ type: 'announcement' });
    const eventActivities = await Event.countDocuments({ type: 'activity' });
    const regularEvents = await Event.countDocuments({ 
      type: 'event', 
      category: { $ne: 'News' } 
    });
    
    results.collections.events = eventCount;
    results.collections.news = eventNews;
    results.collections.announcements = eventAnnouncements;
    results.collections.activities = eventActivities;
    results.collections.regularEvents = regularEvents;
    
    console.log(`Total events (all types): ${eventCount}`);
    console.log(`  - Regular events: ${regularEvents}`);
    console.log(`  - News (type='event', category='News'): ${eventNews}`);
    console.log(`  - Announcements (type='announcement'): ${eventAnnouncements}`);
    console.log(`  - Activities (type='activity'): ${eventActivities}`);
    
    // Check separate collections
    const hasNewsCollection = collectionNames.includes('news');
    const hasAnnouncementsCollection = collectionNames.includes('announcements');
    const hasActivitiesCollection = collectionNames.includes('activities');
    
    if (hasNewsCollection) {
      const newsCollection = db.collection('news');
      const separateNewsCount = await newsCollection.countDocuments();
      console.log(`  - Separate 'news' collection: ${separateNewsCount} documents`);
      if (separateNewsCount > 0) {
        results.recommendations.push(
          'News data exists in separate collection. Ensure controllers query both Event model and separate collections.'
        );
      }
    }
    
    if (hasAnnouncementsCollection) {
      const announcementsCollection = db.collection('announcements');
      const separateAnnouncementsCount = await announcementsCollection.countDocuments();
      console.log(`  - Separate 'announcements' collection: ${separateAnnouncementsCount} documents`);
      if (separateAnnouncementsCount > 0) {
        results.recommendations.push(
          'Announcements data exists in separate collection. Ensure controllers query both Event model and separate collections.'
        );
      }
    }
    
    if (hasActivitiesCollection) {
      const activitiesCollection = db.collection('activities');
      const separateActivitiesCount = await activitiesCollection.countDocuments();
      console.log(`  - Separate 'activities' collection: ${separateActivitiesCount} documents`);
      if (separateActivitiesCount > 0) {
        results.recommendations.push(
          'Activities data exists in separate collection. Ensure controllers query both Event model and separate collections.'
        );
      }
    }
    console.log('');

    // 2. Verify Users
    console.log('[2] VERIFYING USERS');
    console.log('─'.repeat(50));
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const memberCount = await User.countDocuments({ role: 'member' });
    results.collections.users = userCount;
    console.log(`Total users: ${userCount}`);
    console.log(`  - Admins: ${adminCount}`);
    console.log(`  - Members: ${memberCount}`);
    console.log('');

    // 3. Verify HODs
    console.log('[3] VERIFYING HODs');
    console.log('─'.repeat(50));
    const hodCount = await HOD.countDocuments();
    results.collections.hods = hodCount;
    console.log(`Total HODs: ${hodCount}`);
    if (hodCount > 0) {
      const sampleHOD = await HOD.findOne().lean();
      console.log(`  Sample HOD: ${sampleHOD?.name || 'N/A'}`);
    }
    console.log('');

    // 4. Verify Payments
    console.log('[4] VERIFYING PAYMENTS');
    console.log('─'.repeat(50));
    const paymentCount = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const verifiedPayments = await Payment.countDocuments({ status: 'verified' });
    results.collections.payments = paymentCount;
    console.log(`Total payments: ${paymentCount}`);
    console.log(`  - Pending: ${pendingPayments}`);
    console.log(`  - Verified: ${verifiedPayments}`);
    console.log('');

    // 5. Verify Receipts
    console.log('[5] VERIFYING RECEIPTS');
    console.log('─'.repeat(50));
    const receiptCount = await Receipt.countDocuments();
    results.collections.receipts = receiptCount;
    console.log(`Total receipts: ${receiptCount}`);
    
    // Check for embedded receipts in events
    const eventsWithReceipts = await Event.countDocuments({
      'registrations.paymentReceipt': { $exists: true, $ne: null }
    });
    console.log(`Events with embedded payment receipts: ${eventsWithReceipts}`);
    
    if (eventsWithReceipts > 0 && receiptCount === 0) {
      results.issues.push(
        'Events have embedded payment receipts but no standalone Receipt documents found. Consider migrating embedded receipts to separate collection.'
      );
    }
    console.log('');

    // 6. Verify Chat Rules
    console.log('[6] VERIFYING CHAT RULES');
    console.log('─'.repeat(50));
    const chatRuleCount = await ChatRule.countDocuments();
    results.collections.chatRules = chatRuleCount;
    console.log(`Total chat rules: ${chatRuleCount}`);
    console.log('');

    // 7. Verify About Us
    console.log('[7] VERIFYING ABOUT US');
    console.log('─'.repeat(50));
    const aboutUsCount = await AboutUs.countDocuments();
    results.collections.aboutUs = aboutUsCount;
    console.log(`About Us documents: ${aboutUsCount}`);
    if (aboutUsCount === 0) {
      results.recommendations.push('No About Us content found. Consider creating one.');
    }
    console.log('');

    // 8. Check for data consistency issues
    console.log('[8] CHECKING DATA CONSISTENCY');
    console.log('─'.repeat(50));
    
    // Check events with missing required fields
    const eventsMissingDate = await Event.countDocuments({ date: { $exists: false } });
    const eventsMissingTitle = await Event.countDocuments({ title: { $exists: false } });
    
    if (eventsMissingDate > 0) {
      results.issues.push(`${eventsMissingDate} events are missing date field.`);
    }
    if (eventsMissingTitle > 0) {
      results.issues.push(`${eventsMissingTitle} events are missing title field.`);
    }
    
    // Check for events with payment info but no payment documents
    const eventsWithPayment = await Event.countDocuments({
      $or: [
        { requiresPayment: true },
        { paymentAmount: { $gt: 0 } },
        { fee: { $gt: 0 } }
      ]
    });
    
    if (eventsWithPayment > 0) {
      console.log(`Events requiring payment: ${eventsWithPayment}`);
      console.log(`Standalone payments: ${paymentCount}`);
      if (eventsWithPayment > paymentCount) {
        results.recommendations.push(
          'Some events require payment but may not have corresponding Payment documents. Ensure payment documents are created during registration.'
        );
      }
    }
    
    console.log('');

    // 9. Verify database connection type
    console.log('[9] DATABASE CONNECTION INFO');
    console.log('─'.repeat(50));
    const isAtlas = MONGO_URI.includes('mongodb+srv://');
    const isLocal = MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1');
    console.log(`Connection type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : isLocal ? 'Local MongoDB' : 'Remote MongoDB'}`);
    console.log(`Database name: ${mongoose.connection.name}`);
    console.log(`Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log('');

    // Summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('Collection Counts:');
    Object.entries(results.collections).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    console.log('');

    if (results.issues.length > 0) {
      console.log('⚠️  ISSUES FOUND:');
      results.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      console.log('');
    }

    if (results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    if (results.issues.length === 0 && results.recommendations.length === 0) {
      console.log('✅ No issues found. Data appears to be synchronized correctly.');
    }

    console.log('='.repeat(70));
    console.log('VERIFICATION COMPLETED');
    console.log('='.repeat(70));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyDataSync();

