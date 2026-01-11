/**
 * Script to check and verify HOD data in cloud database
 * Helps diagnose why HODs might not be displaying in MongoDB Atlas
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { HOD } from '../models/HOD.model.js';

async function checkHODs() {
  try {
    console.log('======================================================================');
    console.log('CHECKING HOD DATA IN CLOUD DATABASE');
    console.log('======================================================================\n');

    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';
    console.log(`[INFO] Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('[INFO] Connected to MongoDB\n');

    // Check using Mongoose model
    console.log('--- Checking via Mongoose Model ---');
    const hodsFromModel = await HOD.find({}).lean();
    console.log(`[RESULT] Found ${hodsFromModel.length} HOD(s) via Mongoose model`);
    
    if (hodsFromModel.length > 0) {
      console.log('\n[INFO] HOD Documents:');
      hodsFromModel.forEach((hod, index) => {
        console.log(`\n  HOD ${index + 1}:`);
        console.log(`    _id: ${hod._id}`);
        console.log(`    name: ${hod.name || 'MISSING'}`);
        console.log(`    designation: ${hod.designation || 'MISSING'}`);
        console.log(`    photo: ${hod.photo ? (hod.photo.substring(0, 50) + '...') : 'MISSING'}`);
        console.log(`    order: ${hod.order || 0}`);
        console.log(`    createdAt: ${hod.createdAt || 'MISSING'}`);
        console.log(`    updatedAt: ${hod.updatedAt || 'MISSING'}`);
        
        // Check for any issues
        const issues = [];
        if (!hod.name) issues.push('Missing name');
        if (!hod.designation) issues.push('Missing designation');
        if (!hod.photo) issues.push('Missing photo');
        if (hod._id && typeof hod._id !== 'object') issues.push('Invalid _id format');
        
        if (issues.length > 0) {
          console.log(`    ⚠️  ISSUES: ${issues.join(', ')}`);
        } else {
          console.log(`    ✅ All fields present`);
        }
      });
    } else {
      console.log('[WARNING] No HODs found via Mongoose model');
    }

    // Check directly via MongoDB native driver
    console.log('\n--- Checking via MongoDB Native Driver ---');
    const db = mongoose.connection.db;
    const hodsCollection = db.collection('hods');
    const count = await hodsCollection.countDocuments({});
    console.log(`[RESULT] Found ${count} document(s) in 'hods' collection`);
    
    if (count > 0) {
      const rawDocs = await hodsCollection.find({}).toArray();
      console.log('\n[INFO] Raw Documents from Collection:');
      rawDocs.forEach((doc, index) => {
        console.log(`\n  Document ${index + 1}:`);
        console.log(`    Keys: ${Object.keys(doc).join(', ')}`);
        console.log(`    _id type: ${typeof doc._id}, value: ${doc._id}`);
        console.log(`    Full document:`, JSON.stringify(doc, null, 2));
      });
    }

    // Check for documents with different collection names
    console.log('\n--- Checking for Similar Collection Names ---');
    const collections = await db.listCollections().toArray();
    const hodCollections = collections.filter(c => 
      c.name.toLowerCase().includes('hod') || 
      c.name.toLowerCase().includes('head')
    );
    
    if (hodCollections.length > 0) {
      console.log(`[INFO] Found ${hodCollections.length} related collection(s):`);
      hodCollections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }

    // Check indexes
    console.log('\n--- Checking Indexes ---');
    const indexes = await hodsCollection.indexes();
    console.log(`[INFO] Found ${indexes.length} index(es):`);
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)}`);
    });

    // Test query that MongoDB Atlas might be using
    console.log('\n--- Testing Common Queries ---');
    const testQueries = [
      {},
      { name: { $exists: true } },
      { _id: { $exists: true } }
    ];
    
    for (const query of testQueries) {
      const result = await hodsCollection.find(query).toArray();
      console.log(`  Query ${JSON.stringify(query)}: ${result.length} result(s)`);
    }

    console.log('\n======================================================================');
    console.log('SUMMARY');
    console.log('======================================================================');
    console.log(`Mongoose Model Count: ${hodsFromModel.length}`);
    console.log(`Native Collection Count: ${count}`);
    
    if (hodsFromModel.length !== count) {
      console.log('\n⚠️  WARNING: Count mismatch detected!');
      console.log('   This might indicate a schema validation issue.');
    }
    
    if (count > 0 && hodsFromModel.length === 0) {
      console.log('\n⚠️  ISSUE: Documents exist but Mongoose model returns none!');
      console.log('   Possible causes:');
      console.log('   1. Schema validation failing');
      console.log('   2. Field type mismatches');
      console.log('   3. Required fields missing');
    }
    
    if (count > 0) {
      console.log('\n✅ Documents exist in collection');
      console.log('   If not showing in Atlas UI, try:');
      console.log('   1. Refresh the page');
      console.log('   2. Clear query filters');
      console.log('   3. Check if document structure matches schema');
    } else {
      console.log('\n⚠️  No documents found in collection');
      console.log('   You may need to create HOD entries via the admin panel.');
    }

    await mongoose.disconnect();
    console.log('\n[INFO] Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n[ERROR] Failed to check HODs:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkHODs();


