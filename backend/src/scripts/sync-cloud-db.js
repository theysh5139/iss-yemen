import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Event } from '../models/Event.model.js';
import { Payment } from '../models/Payment.model.js';
import { PaymentReceipt } from '../models/PaymentReceipt.model.js';
import { Receipt } from '../models/Receipt.model.js';
import { HOD } from '../models/HOD.model.js';
import { AboutUs } from '../models/AboutUs.model.js';
import { EmailConfig } from '../models/EmailConfig.model.js';
import ChatRule from '../models/ChatRule.model.js';
import { initGridFS } from '../utils/gridfs.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function syncCloudDB() {
  console.log('\n🔄 Cloud Database Synchronization\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Check Connection String
    const isAtlas = MONGO_URI.includes('mongodb+srv://');
    const isLocal = MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1');
    
    console.log(`\n📡 Connection String: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`   Type: ${isAtlas ? '☁️  MongoDB Atlas (Cloud)' : isLocal ? '💻 Local MongoDB' : '🌐 Remote MongoDB'}`);
    
    if (isLocal) {
      console.log('\n⚠️  WARNING: Using local MongoDB!');
      console.log('   To use cloud database, set MONGO_URI to mongodb+srv://...');
      console.log('   Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/iss_yemen_club\n');
    } else if (isAtlas) {
      console.log('\n✅ Using MongoDB Atlas (Cloud Database)\n');
    }

    // Step 2: Connect to Database
    console.log('🔌 Connecting to database...');
    const connectionOptions = {
      ...(isAtlas ? {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      } : {
        ssl: false,
        directConnection: true,
      }),
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(MONGO_URI, connectionOptions);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    const host = mongoose.connection.host;
    
    console.log('📊 Connection Details:');
    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${host}`);
    console.log(`   Ready State: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Not Connected ❌'}\n`);

    // Step 3: List All Collections
    console.log('📦 Checking Collections...\n');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`Found ${collectionNames.length} collections:`);
    collectionNames.forEach(name => {
      console.log(`   ✓ ${name}`);
    });
    console.log('');

    // Step 4: Verify All Models Can Access Cloud DB
    console.log('🧪 Testing Model Connections...\n');
    
    const models = [
      { name: 'User', model: User, collection: 'users' },
      { name: 'Event', model: Event, collection: 'events' },
      { name: 'Payment', model: Payment, collection: 'payments' },
      { name: 'PaymentReceipt', model: PaymentReceipt, collection: 'paymentreceipts' },
      { name: 'Receipt', model: Receipt, collection: 'receipts' },
      { name: 'HOD', model: HOD, collection: 'hods' },
      { name: 'AboutUs', model: AboutUs, collection: 'aboutuses' },
      { name: 'EmailConfig', model: EmailConfig, collection: 'emailconfigs' },
      { name: 'ChatRule', model: ChatRule, collection: 'chatrules' },
    ];

    const syncResults = [];
    
    for (const { name, model, collection } of models) {
      try {
        const count = await model.countDocuments();
        const collectionExists = collectionNames.some(c => 
          c.toLowerCase() === collection.toLowerCase()
        );
        
        const status = collectionExists ? '✅' : '⚠️';
        console.log(`   ${status} ${name.padEnd(20)} → ${collection.padEnd(20)} (${count} documents)`);
        
        syncResults.push({
          name,
          collection,
          count,
          exists: collectionExists,
          connected: true
        });
      } catch (error) {
        console.log(`   ❌ ${name.padEnd(20)} → Error: ${error.message}`);
        syncResults.push({
          name,
          collection,
          count: 0,
          exists: false,
          connected: false,
          error: error.message
        });
      }
    }

    // Step 5: Test GridFS
    console.log('\n📁 Testing GridFS Connection...\n');
    try {
      const gridFSBucket = await initGridFS();
      const files = await gridFSBucket.find({}).limit(1).toArray();
      const fileCount = await gridFSBucket.find({}).count();
      console.log(`   ✅ GridFS connected (${fileCount} file(s) in bucket)`);
    } catch (error) {
      console.log(`   ⚠️  GridFS: ${error.message}`);
    }

    // Step 6: Check Separate Collections (if they exist)
    console.log('\n📋 Checking Separate Collections...\n');
    const separateCollections = ['news', 'announcements', 'activities'];
    
    for (const collName of separateCollections) {
      const exists = collectionNames.some(c => c.toLowerCase() === collName.toLowerCase());
      if (exists) {
        try {
          const coll = db.collection(collName);
          const count = await coll.countDocuments();
          console.log(`   ✅ ${collName.padEnd(20)} (${count} documents)`);
        } catch (error) {
          console.log(`   ⚠️  ${collName.padEnd(20)} Error: ${error.message}`);
        }
      } else {
        console.log(`   ℹ️  ${collName.padEnd(20)} (not found - using Event model)`);
      }
    }

    // Step 7: Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 Synchronization Summary:\n');
    
    const allConnected = syncResults.every(r => r.connected);
    const allExist = syncResults.every(r => r.exists);
    
    if (isAtlas && allConnected && allExist) {
      console.log('✅ All data is synchronized with MongoDB Atlas (Cloud)');
      console.log('✅ All models are connected to cloud database');
      console.log('✅ All collections are accessible');
      console.log('\n🎉 Cloud database synchronization verified successfully!\n');
    } else if (isLocal) {
      console.log('⚠️  Currently using LOCAL MongoDB');
      console.log('   To sync with cloud:');
      console.log('   1. Set MONGO_URI in backend/.env');
      console.log('   2. Use format: mongodb+srv://user:pass@cluster.mongodb.net/iss_yemen_club');
      console.log('   3. Restart backend server\n');
    } else {
      console.log('✅ Connected to remote MongoDB');
      console.log('✅ All models are using the database connection');
      if (!allConnected) {
        console.log('⚠️  Some models have connection issues - check errors above\n');
      } else {
        console.log('\n');
      }
    }

    // Step 8: Data Count Summary
    console.log('📊 Data Count Summary:\n');
    const totalDocs = syncResults.reduce((sum, r) => sum + r.count, 0);
    console.log(`   Total Documents: ${totalDocs}`);
    syncResults.forEach(r => {
      if (r.count > 0) {
        console.log(`   ${r.name}: ${r.count} documents`);
      }
    });
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');

  } catch (error) {
    console.error('\n❌ Synchronization failed:');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.message.includes('authentication')) {
      console.log('💡 Tip: Check your MongoDB username and password in MONGO_URI');
    } else if (error.message.includes('network')) {
      console.log('💡 Tip: Check your network connection and MongoDB Atlas IP whitelist');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Tip: Check your MongoDB connection string and network access');
    }
    
    process.exit(1);
  }
}

syncCloudDB();
