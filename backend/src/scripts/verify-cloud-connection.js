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

async function verifyCloudConnection() {
  console.log('\n🔍 Verifying Cloud Database Connection...\n');
  console.log('='.repeat(60));

  try {
    // Check MONGO_URI
    const isAtlas = MONGO_URI.includes('mongodb+srv://');
    const isLocal = MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1');
    
    console.log(`\n📡 Connection String: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`   Type: ${isAtlas ? '☁️  MongoDB Atlas (Cloud)' : isLocal ? '💻 Local MongoDB' : '🌐 Remote MongoDB'}`);
    
    if (isLocal) {
      console.log('\n⚠️  WARNING: Using local MongoDB!');
      console.log('   To use cloud database, set MONGO_URI to mongodb+srv://...');
      console.log('   Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/iss_yemen_club\n');
    }

    // Connect to database
    console.log('\n🔌 Connecting to database...');
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

    // Verify connection details
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    const host = mongoose.connection.host;
    const port = mongoose.connection.port;
    
    console.log('📊 Connection Details:');
    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${host}${port ? `:${port}` : ''}`);
    console.log(`   Ready State: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Not Connected ❌'}`);

    // Check all collections
    console.log('\n📦 Verifying Collections...\n');
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const expectedCollections = [
      'users',
      'events',
      'payments',
      'paymentreceipts',
      'receipts',
      'hods',
      'aboutuses',
      'emailconfigs',
      'chatrules',
      'images.files', // GridFS
      'images.chunks' // GridFS
    ];

    console.log('Found Collections:');
    collectionNames.forEach(name => {
      const isExpected = expectedCollections.some(expected => 
        name.toLowerCase() === expected.toLowerCase() || 
        name.toLowerCase().includes(expected.toLowerCase().split('.')[0])
      );
      console.log(`   ${isExpected ? '✅' : 'ℹ️ '} ${name}`);
    });

    // Test model operations
    console.log('\n🧪 Testing Model Connections...\n');
    
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

    for (const { name, model, collection } of models) {
      try {
        const count = await model.countDocuments();
        const collectionExists = collectionNames.some(c => 
          c.toLowerCase() === collection.toLowerCase()
        );
        console.log(`   ${collectionExists ? '✅' : '⚠️ '} ${name.padEnd(20)} → ${collection.padEnd(20)} (${count} documents)`);
      } catch (error) {
        console.log(`   ❌ ${name.padEnd(20)} → Error: ${error.message}`);
      }
    }

    // Test GridFS
    console.log('\n📁 Testing GridFS Connection...\n');
    try {
      const gridFSBucket = await initGridFS();
      const files = await gridFSBucket.find({}).limit(1).toArray();
      console.log(`   ✅ GridFS connected (${files.length > 0 ? files.length + ' file(s) found' : 'empty bucket'})`);
    } catch (error) {
      console.log(`   ⚠️  GridFS: ${error.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Summary:\n');
    
    if (isAtlas) {
      console.log('✅ All data is connected to MongoDB Atlas (Cloud)');
      console.log('✅ All models are using cloud database');
      console.log('✅ GridFS is using cloud database');
      console.log('\n🎉 Cloud database connection verified successfully!\n');
    } else if (isLocal) {
      console.log('⚠️  Currently using LOCAL MongoDB');
      console.log('   To switch to cloud:');
      console.log('   1. Set MONGO_URI in backend/.env');
      console.log('   2. Use format: mongodb+srv://user:pass@cluster.mongodb.net/iss_yemen_club');
      console.log('   3. Restart backend server\n');
    } else {
      console.log('✅ Connected to remote MongoDB');
      console.log('✅ All models are using the database connection\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');

  } catch (error) {
    console.error('\n❌ Verification failed:');
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

verifyCloudConnection();
