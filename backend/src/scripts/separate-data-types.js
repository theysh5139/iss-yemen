import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

/**
 * Separate events, news, announcements, and activities into organized structure
 */
async function separateDataTypes() {
  try {
    console.log('='.repeat(70));
    console.log('SEPARATING DATA TYPES: Events, News, Announcements, Activities');
    console.log('='.repeat(70));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70));

    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    // Get all documents from events collection
    const allDocuments = await Event.find({}).lean();
    console.log(`[INFO] Found ${allDocuments.length} total documents in events collection\n`);

    // Separate by type and category
    const separated = {
      events: [],      // type: 'event', category: NOT 'News'
      news: [],        // type: 'event', category: 'News'
      announcements: [], // type: 'announcement'
      activities: []    // type: 'activity'
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
        // Unknown type, categorize as event
        console.log(`[WARN] Unknown type/category for document: ${doc._id} - type: ${doc.type}, category: ${doc.category}`);
        separated.events.push(doc);
      }
    }

    // Display counts
    console.log('[SEPARATION RESULTS]');
    console.log('='.repeat(70));
    console.log(`Events (type: 'event', category: NOT 'News'): ${separated.events.length}`);
    console.log(`News (type: 'event', category: 'News'): ${separated.news.length}`);
    console.log(`Announcements (type: 'announcement'): ${separated.announcements.length}`);
    console.log(`Activities (type: 'activity'): ${separated.activities.length}`);
    console.log(`Total: ${separated.events.length + separated.news.length + separated.announcements.length + separated.activities.length}`);
    console.log('='.repeat(70));

    // Display sample data for each type
    console.log('\n[SAMPLE DATA]');
    
    if (separated.events.length > 0) {
      console.log('\n📅 EVENTS:');
      separated.events.slice(0, 3).forEach(e => {
        console.log(`  - "${e.title}" (${e.category}) - Date: ${e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}`);
      });
      if (separated.events.length > 3) {
        console.log(`  ... and ${separated.events.length - 3} more events`);
      }
    }

    if (separated.news.length > 0) {
      console.log('\n📰 NEWS:');
      separated.news.slice(0, 3).forEach(n => {
        console.log(`  - "${n.title}" - Date: ${n.date ? new Date(n.date).toLocaleDateString() : 'N/A'}`);
      });
      if (separated.news.length > 3) {
        console.log(`  ... and ${separated.news.length - 3} more news items`);
      }
    }

    if (separated.announcements.length > 0) {
      console.log('\n📢 ANNOUNCEMENTS:');
      separated.announcements.slice(0, 3).forEach(a => {
        console.log(`  - "${a.title}" - Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}`);
      });
      if (separated.announcements.length > 3) {
        console.log(`  ... and ${separated.announcements.length - 3} more announcements`);
      }
    }

    if (separated.activities.length > 0) {
      console.log('\n🎯 ACTIVITIES:');
      separated.activities.slice(0, 3).forEach(a => {
        console.log(`  - "${a.title}" - Date: ${a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}`);
      });
      if (separated.activities.length > 3) {
        console.log(`  ... and ${separated.activities.length - 3} more activities`);
      }
    }

    // Create summary report
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY REPORT');
    console.log('='.repeat(70));
    console.log('Current Structure: All data types stored in "events" collection');
    console.log('\nQuery Examples:');
    console.log('\n1. Get all Events (excluding news):');
    console.log('   db.events.find({ type: "event", category: { $ne: "News" } })');
    console.log(`   Result: ${separated.events.length} documents`);
    
    console.log('\n2. Get all News:');
    console.log('   db.events.find({ type: "event", category: "News" })');
    console.log(`   Result: ${separated.news.length} documents`);
    
    console.log('\n3. Get all Announcements:');
    console.log('   db.events.find({ type: "announcement" })');
    console.log(`   Result: ${separated.announcements.length} documents`);
    
    console.log('\n4. Get all Activities:');
    console.log('   db.events.find({ type: "activity" })');
    console.log(`   Result: ${separated.activities.length} documents`);

    // Export separated data to JSON files (optional)
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const exportDir = path.join(__dirname, '../../data_export');

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    console.log('\n' + '='.repeat(70));
    console.log('EXPORTING SEPARATED DATA TO JSON FILES');
    console.log('='.repeat(70));
    console.log(`Export directory: ${exportDir}`);

    // Export each type to separate JSON file
    fs.writeFileSync(
      path.join(exportDir, 'events.json'),
      JSON.stringify(separated.events, null, 2)
    );
    console.log(`✓ Exported ${separated.events.length} events to events.json`);

    fs.writeFileSync(
      path.join(exportDir, 'news.json'),
      JSON.stringify(separated.news, null, 2)
    );
    console.log(`✓ Exported ${separated.news.length} news items to news.json`);

    fs.writeFileSync(
      path.join(exportDir, 'announcements.json'),
      JSON.stringify(separated.announcements, null, 2)
    );
    console.log(`✓ Exported ${separated.announcements.length} announcements to announcements.json`);

    fs.writeFileSync(
      path.join(exportDir, 'activities.json'),
      JSON.stringify(separated.activities, null, 2)
    );
    console.log(`✓ Exported ${separated.activities.length} activities to activities.json`);

    // Create summary file
    const summary = {
      timestamp: new Date().toISOString(),
      total: allDocuments.length,
      counts: {
        events: separated.events.length,
        news: separated.news.length,
        announcements: separated.announcements.length,
        activities: separated.activities.length
      },
      breakdown: {
        events: separated.events.map(e => ({ id: e._id.toString(), title: e.title, category: e.category })),
        news: separated.news.map(n => ({ id: n._id.toString(), title: n.title })),
        announcements: separated.announcements.map(a => ({ id: a._id.toString(), title: a.title })),
        activities: separated.activities.map(a => ({ id: a._id.toString(), title: a.title }))
      }
    };

    fs.writeFileSync(
      path.join(exportDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log(`✓ Created summary.json with complete breakdown`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ SEPARATION COMPLETE!');
    console.log('='.repeat(70));
    console.log(`\nAll data has been analyzed and exported to: ${exportDir}`);
    console.log('\nFiles created:');
    console.log('  - events.json (Events only)');
    console.log('  - news.json (News items only)');
    console.log('  - announcements.json (Announcements only)');
    console.log('  - activities.json (Activities only)');
    console.log('  - summary.json (Complete breakdown)');
    console.log('\nNote: Data remains in the "events" collection.');
    console.log('      Use the query examples above to access each type separately.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Separation failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run separation
separateDataTypes();

