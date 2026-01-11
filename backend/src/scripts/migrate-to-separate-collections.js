import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

/**
 * Create separate collections for news, announcements, and activities
 */
async function migrateToSeparateCollections() {
  try {
    console.log('='.repeat(70));
    console.log('MIGRATING TO SEPARATE COLLECTIONS');
    console.log('='.repeat(70));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70));

    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get all documents from events collection
    const allDocuments = await Event.find({}).lean();
    console.log(`[INFO] Found ${allDocuments.length} total documents in events collection\n`);

    // Separate by type and category
    const separated = {
      events: [],      // type: 'event', category: NOT 'News' (keep in events)
      news: [],        // type: 'event', category: 'News' → move to news collection
      announcements: [], // type: 'announcement' → move to announcements collection
      activities: []    // type: 'activity' → move to activities collection
    };

    // Categorize documents
    for (const doc of allDocuments) {
      if (doc.type === 'event' && doc.category === 'News') {
        separated.news.push(doc);
      } else if (doc.type === 'event' && doc.category !== 'News') {
        separated.events.push(doc);
      } else if (doc.type === 'announcement') {
        separated.announcements.push(doc);
      } else if (doc.type === 'activity') {
        separated.activities.push(doc);
      } else {
        // Unknown type, keep in events
        console.log(`[WARN] Unknown type/category for document: ${doc._id} - type: ${doc.type}, category: ${doc.category}`);
        separated.events.push(doc);
      }
    }

    console.log('[SEPARATION RESULTS]');
    console.log('─'.repeat(50));
    console.log(`📅 Events (staying in 'events' collection): ${separated.events.length}`);
    console.log(`📰 News (moving to 'news' collection): ${separated.news.length}`);
    console.log(`📢 Announcements (moving to 'announcements' collection): ${separated.announcements.length}`);
    console.log(`🎯 Activities (moving to 'activities' collection): ${separated.activities.length}`);
    console.log('─'.repeat(50));

    // Create new collections and insert data
    let newsInserted = 0;
    let announcementsInserted = 0;
    let activitiesInserted = 0;
    let newsDeleted = 0;
    let announcementsDeleted = 0;
    let activitiesDeleted = 0;

    // Migrate News to 'news' collection
    if (separated.news.length > 0) {
      console.log('\n[STEP 1] Migrating News to separate collection...');
      const newsCollection = db.collection('news');
      
      for (const newsDoc of separated.news) {
        try {
          // Check if already exists
          const existing = await newsCollection.findOne({ _id: newsDoc._id });
          if (existing) {
            console.log(`  [SKIP] News "${newsDoc.title}" already exists in news collection`);
            continue;
          }

          // Insert into news collection
          await newsCollection.insertOne(newsDoc);
          newsInserted++;
          console.log(`  ✓ Migrated news: "${newsDoc.title}"`);

          // Delete from events collection
          await Event.deleteOne({ _id: newsDoc._id });
          newsDeleted++;
        } catch (error) {
          console.error(`  ✗ Failed to migrate news "${newsDoc.title}":`, error.message);
        }
      }
      console.log(`[STEP 1] Completed: ${newsInserted} news items migrated, ${newsDeleted} removed from events`);
    }

    // Migrate Announcements to 'announcements' collection
    if (separated.announcements.length > 0) {
      console.log('\n[STEP 2] Migrating Announcements to separate collection...');
      const announcementsCollection = db.collection('announcements');
      
      for (const annDoc of separated.announcements) {
        try {
          // Check if already exists
          const existing = await announcementsCollection.findOne({ _id: annDoc._id });
          if (existing) {
            console.log(`  [SKIP] Announcement "${annDoc.title}" already exists in announcements collection`);
            continue;
          }

          // Insert into announcements collection
          await announcementsCollection.insertOne(annDoc);
          announcementsInserted++;
          console.log(`  ✓ Migrated announcement: "${annDoc.title}"`);

          // Delete from events collection
          await Event.deleteOne({ _id: annDoc._id });
          announcementsDeleted++;
        } catch (error) {
          console.error(`  ✗ Failed to migrate announcement "${annDoc.title}":`, error.message);
        }
      }
      console.log(`[STEP 2] Completed: ${announcementsInserted} announcements migrated, ${announcementsDeleted} removed from events`);
    }

    // Migrate Activities to 'activities' collection
    if (separated.activities.length > 0) {
      console.log('\n[STEP 3] Migrating Activities to separate collection...');
      const activitiesCollection = db.collection('activities');
      
      for (const activityDoc of separated.activities) {
        try {
          // Check if already exists
          const existing = await activitiesCollection.findOne({ _id: activityDoc._id });
          if (existing) {
            console.log(`  [SKIP] Activity "${activityDoc.title}" already exists in activities collection`);
            continue;
          }

          // Insert into activities collection
          await activitiesCollection.insertOne(activityDoc);
          activitiesInserted++;
          console.log(`  ✓ Migrated activity: "${activityDoc.title}"`);

          // Delete from events collection
          await Event.deleteOne({ _id: activityDoc._id });
          activitiesDeleted++;
        } catch (error) {
          console.error(`  ✗ Failed to migrate activity "${activityDoc.title}":`, error.message);
        }
      }
      console.log(`[STEP 3] Completed: ${activitiesInserted} activities migrated, ${activitiesDeleted} removed from events`);
    }

    // Verify final state
    const finalCounts = {
      events: await Event.countDocuments({}),
      news: await db.collection('news').countDocuments(),
      announcements: await db.collection('announcements').countDocuments(),
      activities: await db.collection('activities').countDocuments()
    };

    console.log('\n' + '='.repeat(70));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log('Data Migrated:');
    console.log(`  📰 News: ${newsInserted} items → 'news' collection`);
    console.log(`  📢 Announcements: ${announcementsInserted} items → 'announcements' collection`);
    console.log(`  🎯 Activities: ${activitiesInserted} items → 'activities' collection`);
    console.log('\nFinal Collection Counts:');
    console.log(`  📅 Events collection: ${finalCounts.events} documents`);
    console.log(`  📰 News collection: ${finalCounts.news} documents`);
    console.log(`  📢 Announcements collection: ${finalCounts.announcements} documents`);
    console.log(`  🎯 Activities collection: ${finalCounts.activities} documents`);
    console.log('='.repeat(70));
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Note: Data has been moved to separate collections.');
    console.log('   - Events remain in "events" collection');
    console.log('   - News is now in "news" collection');
    console.log('   - Announcements is now in "announcements" collection');
    console.log('   - Activities is now in "activities" collection');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateToSeparateCollections();


