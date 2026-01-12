import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function testLogin() {
  try {
    console.log('\n🔍 Testing Login Credentials...\n');
    console.log('='.repeat(60));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'admin@issyemen.com';
    const testPassword = 'Admin123!';

    console.log(`Testing login for: ${testEmail}\n`);

    // Find user
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('\n💡 Run: npm run verify-admin\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.isEmailVerified() ? 'Yes ✅' : 'No ❌'}`);

    // Test password
    console.log('\n🔐 Testing password...');
    const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
    
    if (passwordMatch) {
      console.log('✅ Password matches!');
    } else {
      console.log('❌ Password does NOT match!');
      console.log(`\n💡 Expected password: ${testPassword}`);
      console.log('💡 Run: npm run verify-admin to reset password\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Check email verification
    if (!user.isEmailVerified()) {
      console.log('\n⚠️  Email not verified!');
      console.log('💡 This will cause login to fail with "Email not verified"');
      console.log('💡 Run: npm run verify-admin to fix this\n');
    } else {
      console.log('✅ Email is verified!');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Login Test Summary:');
    console.log('='.repeat(60));
    console.log(`Email: ${testEmail} ✅`);
    console.log(`Password: ${testPassword} ${passwordMatch ? '✅' : '❌'}`);
    console.log(`Email Verified: ${user.isEmailVerified() ? '✅' : '❌'}`);
    console.log(`Role: ${user.role} ✅`);
    
    if (passwordMatch && user.isEmailVerified()) {
      console.log('\n✅ All checks passed! Login should work.\n');
    } else {
      console.log('\n❌ Some checks failed. Run: npm run verify-admin\n');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testLogin();
