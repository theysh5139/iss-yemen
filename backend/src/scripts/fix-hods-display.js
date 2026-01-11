/**
 * Script to fix HOD data display issues in MongoDB Atlas
 * Ensures all HOD documents have proper structure and are visible
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { HOD } from '../models/HOD.model.js';

async function fixHODsDisplay() {
  try {
    console.log('======================================================================');
    console.log('FIXING HOD DATA DISPLAY ISSUES');
    console.log('======================================================================\n');

    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
    console.log(`[INFO] Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('[INFO] Connected to MongoDB\n');

    // Get all documents from collection directly
    const db = mongoose.connection.db;
    const hodsCollection = db.collection('hods');
    const rawDocs = await hodsCollection.find({}).toArray();
    
    console.log(`[INFO] Found ${rawDocs.length} document(s) in collection\n`);

    if (rawDocs.length === 0) {
      console.log('[INFO] No documents to fix. Collection is empty.');
      await mongoose.disconnect();
      return;
    }

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of rawDocs) {
      try {
        console.log(`\n[PROCESSING] Document ID: ${doc._id}`);
        
        // Check if document can be loaded via Mongoose model
        const hod = await HOD.findById(doc._id);
        
        if (!hod) {
          console.log('  ⚠️  Document exists but cannot be loaded via model');
          console.log('  [FIXING] Attempting to fix document structure...');
          
          // Try to create a valid HOD from raw document
          const fixedData = {
            name: doc.name || 'Unknown',
            designation: doc.designation || 'Unknown',
            photo: doc.photo || '',
            order: doc.order || 0
          };
          
          // Delete the problematic document
          await hodsCollection.deleteOne({ _id: doc._id });
          
          // Create a new valid document
          const newHod = await HOD.create(fixedData);
          console.log(`  ✅ Fixed and recreated as: ${newHod._id}`);
          fixed++;
        } else {
          // Document is valid, but check if it needs any fixes
          let needsUpdate = false;
          const updates = {};
          
          if (!hod.name || hod.name.trim() === '') {
            updates.name = 'Unknown';
            needsUpdate = true;
          }
          
          if (!hod.designation || hod.designation.trim() === '') {
            updates.designation = 'Unknown';
            needsUpdate = true;
          }
          
          if (hod.photo === undefined || hod.photo === null) {
            updates.photo = '';
            needsUpdate = true;
          }
          
          if (hod.order === undefined || hod.order === null) {
            updates.order = 0;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            Object.assign(hod, updates);
            await hod.save();
            console.log(`  ✅ Updated missing fields: ${Object.keys(updates).join(', ')}`);
            fixed++;
          } else {
            console.log(`  ✓ Document is valid`);
            skipped++;
          }
        }
      } catch (error) {
        console.error(`  ✗ Error processing document ${doc._id}:`, error.message);
        errors++;
      }
    }

    // Verify final state
    console.log('\n--- Verification ---');
    const finalCount = await HOD.countDocuments({});
    const finalDocs = await HOD.find({}).lean();
    
    console.log(`[RESULT] Total HODs after fix: ${finalCount}`);
    
    if (finalDocs.length > 0) {
      console.log('\n[INFO] All HOD documents:');
      finalDocs.forEach((hod, index) => {
        console.log(`  ${index + 1}. ${hod.name} (${hod.designation}) - ID: ${hod._id}`);
      });
    }

    console.log('\n======================================================================');
    console.log('FIX SUMMARY');
    console.log('======================================================================');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⊘ Skipped (already valid): ${skipped}`);
    console.log(`✗ Errors: ${errors}`);
    console.log(`📋 Final Count: ${finalCount}`);
    console.log('\n[INFO] If documents still don\'t show in Atlas UI:');
    console.log('  1. Refresh the MongoDB Atlas page');
    console.log('  2. Clear any query filters');
    console.log('  3. Check the Documents tab count matches');
    console.log('  4. Try querying: {} (empty query)');

    await mongoose.disconnect();
    console.log('\n[INFO] Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n[ERROR] Failed to fix HODs:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixHODsDisplay();


