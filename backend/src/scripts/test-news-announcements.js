import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function testNewsAndAnnouncements() {
  try {
    console.log('='.repeat(70));
    console.log('TESTING NEWS AND ANNOUNCEMENTS QUERIES');
    console.log('='.repeat(70));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70));

    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('[COLLECTIONS]');
    console.log('─'.repeat(50));
    console.log('Available collections:', collectionNames.join(', '));
    console.log('─'.repeat(50));
    console.log('Has "events" collection:', collectionNames.includes('events'));
    console.log('Has "news" collection:', collectionNames.includes('news'));
    console.log('Has "announcements" collection:', collectionNames.includes('announcements'));
    console.log('Has "activities" collection:', collectionNames.includes('activities'));
    console.log('');

    // Query from Event model
    console.log('[QUERY FROM EVENT MODEL]');
    console.log('─'.repeat(50));
    const eventNews = await Event.find({ type: 'event', category: 'News' }).lean();
    const eventAnnouncements = await Event.find({ type: 'announcement' }).lean();
    const eventActivities = await Event.find({ type: 'activity' }).lean();
    
    console.log(`News (type='event', category='News'): ${eventNews.length}`);
    eventNews.forEach(item => {
      console.log(`  - ${item.title} (ID: ${item._id}, isPublic: ${item.isPublic})`);
    });
    
    console.log(`\nAnnouncements (type='announcement'): ${eventAnnouncements.length}`);
    eventAnnouncements.forEach(item => {
      console.log(`  - ${item.title} (ID: ${item._id}, isPublic: ${item.isPublic})`);
    });
    
    console.log(`\nActivities (type='activity'): ${eventActivities.length}`);
    eventActivities.forEach(item => {
      console.log(`  - ${item.title} (ID: ${item._id}, isPublic: ${item.isPublic})`);
    });
    console.log('');

    // Query from separate collections if they exist
    if (collectionNames.includes('news')) {
      console.log('[QUERY FROM NEWS COLLECTION]');
      console.log('─'.repeat(50));
      const newsCollection = db.collection('news');
      const separateNews = await newsCollection.find({}).toArray();
      console.log(`News items: ${separateNews.length}`);
      separateNews.forEach(item => {
        console.log(`  - ${item.title} (ID: ${item._id}, isPublic: ${item.isPublic})`);
      });
      console.log('');
    }

    if (collectionNames.includes('announcements')) {
      console.log('[QUERY FROM ANNOUNCEMENTS COLLECTION]');
      console.log('─'.repeat(50));
      const announcementsCollection = db.collection('announcements');
      const separateAnnouncements = await announcementsCollection.find({}).toArray();
      console.log(`Announcements: ${separateAnnouncements.length}`);
      separateAnnouncements.forEach(item => {
        console.log(`  - ${item.title} (ID: ${item._id}, isPublic: ${item.isPublic})`);
      });
      console.log('');
    }

    if (collectionNames.includes('activities')) {
      console.log('[QUERY FROM ACTIVITIES COLLECTION]');
      console.log('─'.repeat(50));
      const activitiesCollection = db.collection('activities');
      const separateActivities = await activitiesCollection.find({}).toArray();
      console.log(`Activities: ${separateActivities.length}`);
      separateActivities.forEach(item => {
        console.log(`  - ${item.title} (ID: ${item._id}, isPublic: ${item.isPublic})`);
      });
      console.log('');
    }

    // Test public query
    console.log('[TESTING PUBLIC QUERY]');
    console.log('─'.repeat(50));
    const publicQuery = { isPublic: true };
    const publicNews = await Event.find({ type: 'event', category: 'News', ...publicQuery }).lean();
    const publicAnnouncements = await Event.find({ type: 'announcement', ...publicQuery }).lean();
    console.log(`Public News: ${publicNews.length}`);
    console.log(`Public Announcements: ${publicAnnouncements.length}`);
    console.log('');

    console.log('='.repeat(70));
    console.log('TEST COMPLETED');
    console.log('='.repeat(70));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testNewsAndAnnouncements();

