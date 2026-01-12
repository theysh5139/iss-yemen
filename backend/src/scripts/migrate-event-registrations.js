import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

/**
 * Migrate event registrations to a separate 'eventregistrations' collection
 * This extracts all registrations from events and stores them as separate documents
 */
async function migrateEventRegistrations() {
  try {
    console.log('='.repeat(70));
    console.log('MIGRATING EVENT REGISTRATIONS TO SEPARATE COLLECTION');
    console.log('='.repeat(70));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(70));

    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get all events with registrations
    const events = await Event.find({
      'registrations': { $exists: true, $ne: [] }
    }).lean();

    console.log(`[INFO] Found ${events.length} events with registrations\n`);

    if (events.length === 0) {
      console.log('[INFO] No events with registrations found. Nothing to migrate.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create or get the eventregistrations collection
    const registrationsCollection = db.collection('eventregistrations');

    let totalRegistrations = 0;
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('[STEP 1] Extracting registrations from events...\n');

    for (const event of events) {
      if (!event.registrations || event.registrations.length === 0) {
        continue;
      }

      totalRegistrations += event.registrations.length;

      for (let index = 0; index < event.registrations.length; index++) {
        const reg = event.registrations[index];
        
        try {
          // Create a unique ID for this registration
          const registrationId = `${event._id.toString()}-${index}`;
          
          // Check if this registration already exists
          const existing = await registrationsCollection.findOne({ 
            eventId: event._id.toString(),
            registrationIndex: index
          });

          if (existing) {
            console.log(`  [SKIP] Registration ${index} for event "${event.title}" already exists`);
            skippedCount++;
            continue;
          }

          // Create registration document
          const registrationDoc = {
            _id: new mongoose.Types.ObjectId(),
            eventId: event._id,
            eventTitle: event.title,
            eventDate: event.date,
            eventLocation: event.location,
            eventCategory: event.category,
            registrationIndex: index,
            user: reg.user,
            registeredAt: reg.registeredAt || new Date(),
            registrationName: reg.registrationName || null,
            registrationEmail: reg.registrationEmail || null,
            matricNumber: reg.matricNumber || null,
            phone: reg.phone || null,
            notes: reg.notes || null,
            paymentReceipt: reg.paymentReceipt || null,
            createdAt: reg.registeredAt || new Date(),
            updatedAt: new Date()
          };

          // Insert into eventregistrations collection
          await registrationsCollection.insertOne(registrationDoc);
          migratedCount++;
          
          if (migratedCount % 10 === 0) {
            console.log(`  ✓ Migrated ${migratedCount} registrations...`);
          }
        } catch (error) {
          console.error(`  ✗ Failed to migrate registration ${index} for event "${event.title}":`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total registrations found: ${totalRegistrations}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(70));

    // Verify the migration
    const collectionCount = await registrationsCollection.countDocuments();
    console.log(`\n[VERIFICATION] Total documents in 'eventregistrations' collection: ${collectionCount}`);

    if (collectionCount > 0) {
      // Show sample registrations
      const samples = await registrationsCollection.find({}).limit(3).toArray();
      console.log('\n[SAMPLE REGISTRATIONS]');
      samples.forEach((reg, idx) => {
        console.log(`  ${idx + 1}. Event: "${reg.eventTitle}"`);
        console.log(`     User: ${reg.registrationName || 'N/A'}`);
        console.log(`     Email: ${reg.registrationEmail || 'N/A'}`);
        console.log(`     Registered: ${new Date(reg.registeredAt).toLocaleDateString()}`);
        console.log(`     Has Payment: ${reg.paymentReceipt ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Note: Registrations are now stored in the "eventregistrations" collection.');
    console.log('   Original registrations remain in events.registrations for backward compatibility.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateEventRegistrations();

