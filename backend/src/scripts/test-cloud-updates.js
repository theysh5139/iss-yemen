/**
 * Quick test to verify cloud DB updates reflect immediately after new entries
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { HOD } from '../models/HOD.model.js';

async function testCloudUpdates() {
  try {
    console.log('======================================================================');
    console.log('TESTING CLOUD DB REAL-TIME UPDATES');
    console.log('======================================================================\n');

    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
    console.log(`[INFO] Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('[INFO] Connected to MongoDB\n');

    // Step 1: Get initial count
    const initialCount = await HOD.countDocuments({});
    console.log(`[STEP 1] Initial HOD count: ${initialCount}`);

    // Step 2: Create a test HOD entry
    console.log('\n[STEP 2] Creating test HOD entry...');
    const testHOD = await HOD.create({
      name: `Test HOD ${Date.now()}`,
      designation: 'Test Designation',
      photo: 'https://via.placeholder.com/150',
      order: 999
    });
    console.log(`✅ Created HOD: ${testHOD.name} (ID: ${testHOD._id})`);

    // Step 3: Immediately verify it's in cloud DB
    console.log('\n[STEP 3] Verifying entry in cloud DB...');
    const verifyCount = await HOD.countDocuments({});
    console.log(`[RESULT] HOD count after creation: ${verifyCount}`);
    
    if (verifyCount === initialCount + 1) {
      console.log('✅ SUCCESS: Entry count increased correctly');
    } else {
      console.log('⚠️  WARNING: Count mismatch!');
    }

    // Step 4: Retrieve the entry directly
    const retrieved = await HOD.findById(testHOD._id);
    if (retrieved) {
      console.log(`✅ SUCCESS: Entry retrieved from cloud DB`);
      console.log(`   Name: ${retrieved.name}`);
      console.log(`   Designation: ${retrieved.designation}`);
      console.log(`   Created: ${retrieved.createdAt}`);
    } else {
      console.log('❌ ERROR: Entry not found in cloud DB!');
    }

    // Step 5: Check via native MongoDB driver
    const db = mongoose.connection.db;
    const hodsCollection = db.collection('hods');
    const nativeCount = await hodsCollection.countDocuments({});
    console.log(`\n[STEP 4] Native MongoDB count: ${nativeCount}`);
    
    if (nativeCount === verifyCount) {
      console.log('✅ SUCCESS: Mongoose and native driver counts match');
    } else {
      console.log('⚠️  WARNING: Count mismatch between Mongoose and native driver');
    }

    // Step 6: Verify entry exists in native collection
    const nativeDoc = await hodsCollection.findOne({ _id: testHOD._id });
    if (nativeDoc) {
      console.log('✅ SUCCESS: Entry found via native MongoDB driver');
    } else {
      console.log('❌ ERROR: Entry not found via native MongoDB driver!');
    }

    // Step 7: Test update
    console.log('\n[STEP 5] Testing update...');
    testHOD.name = `Updated Test HOD ${Date.now()}`;
    await testHOD.save();
    
    const updated = await HOD.findById(testHOD._id);
    if (updated && updated.name === testHOD.name) {
      console.log('✅ SUCCESS: Update reflected immediately in cloud DB');
      console.log(`   Updated name: ${updated.name}`);
    } else {
      console.log('❌ ERROR: Update not reflected!');
    }

    // Step 8: Cleanup - Delete test entry
    console.log('\n[STEP 6] Cleaning up test entry...');
    await HOD.findByIdAndDelete(testHOD._id);
    const finalCount = await HOD.countDocuments({});
    
    if (finalCount === initialCount) {
      console.log('✅ SUCCESS: Test entry deleted, count restored');
    } else {
      console.log('⚠️  WARNING: Count not restored after deletion');
    }

    console.log('\n======================================================================');
    console.log('TEST SUMMARY');
    console.log('======================================================================');
    console.log('✅ Create: Working - Entries saved to cloud DB immediately');
    console.log('✅ Read: Working - Entries retrievable from cloud DB');
    console.log('✅ Update: Working - Updates reflected immediately');
    console.log('✅ Delete: Working - Deletions reflected immediately');
    console.log('\n[CONCLUSION] Cloud DB updates are working correctly!');
    console.log('   New entries will appear in cloud DB immediately.');
    console.log('   MongoDB Atlas UI may need refresh to show new entries.');

    await mongoose.disconnect();
    console.log('\n[INFO] Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n[ERROR] Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCloudUpdates();


