import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function checkAnnouncements() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check Event model
    const eventAnnouncements = await Event.find({
      $or: [
        { type: 'announcement' },
        { type: 'event', category: 'News' }
      ]
    }).lean();

    console.log(`[Event Model] Found ${eventAnnouncements.length} announcements:`);
    eventAnnouncements.forEach(a => {
      console.log(`  - "${a.title}"`);
      console.log(`    Type: ${a.type}, Category: ${a.category || 'N/A'}`);
      console.log(`    Cancelled: ${a.cancelled || false}`);
      console.log(`    Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'No date'}`);
      console.log('');
    });

    // Check separate collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('announcements')) {
      const announcementsCollection = db.collection('announcements');
      const separateAnnouncements = await announcementsCollection.find({}).toArray();
      console.log(`[Separate Announcements Collection] Found ${separateAnnouncements.length} announcements:`);
      separateAnnouncements.forEach(a => {
        console.log(`  - "${a.title}"`);
        console.log(`    Type: ${a.type || 'N/A'}, Category: ${a.category || 'N/A'}`);
        console.log(`    Cancelled: ${a.cancelled || false}`);
        console.log(`    Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'No date'}`);
        console.log('');
      });
    }

    if (collectionNames.includes('news')) {
      const newsCollection = db.collection('news');
      const newsItems = await newsCollection.find({}).toArray();
      console.log(`[Separate News Collection] Found ${newsItems.length} news items:`);
      newsItems.forEach(a => {
        console.log(`  - "${a.title}"`);
        console.log(`    Type: ${a.type || 'N/A'}, Category: ${a.category || 'N/A'}`);
        console.log(`    Cancelled: ${a.cancelled || false}`);
        console.log(`    Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'No date'}`);
        console.log('');
      });
    }

    // Count active announcements (using the updated logic)
    const activeCount = eventAnnouncements.filter(a => !a.cancelled).length;
    console.log(`\n[Summary] Active Announcements: ${activeCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAnnouncements();

