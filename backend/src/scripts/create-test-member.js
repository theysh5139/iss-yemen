import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

// Test member account that bypasses OTP/TAC for testing purposes
const TEST_EMAIL = process.env.TEST_MEMBER_EMAIL || 'testmember@test.com';
const TEST_PASSWORD = process.env.TEST_MEMBER_PASSWORD || 'TestMember123!';
const TEST_NAME = process.env.TEST_MEMBER_NAME || 'Test Member';

async function createTestMember() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    // Check if test member already exists
    const existing = await User.findOne({ email: TEST_EMAIL.toLowerCase() });
    if (existing) {
      if (existing.role === 'member') {
        console.log(`[INFO] Test member account with email ${TEST_EMAIL} already exists.`);
        console.log(`[INFO] Email: ${existing.email}`);
        console.log(`[INFO] Role: ${existing.role}`);
        console.log(`[INFO] This account will bypass OTP/TAC during login.`);
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to member
        const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
        existing.role = 'member';
        existing.passwordHash = passwordHash;
        existing.emailVerifiedAt = new Date(); // Auto-verify member
        existing.name = TEST_NAME;
        await existing.save();
        console.log(`[SUCCESS] Updated user ${TEST_EMAIL} to test member role.`);
        console.log(`[INFO] Email: ${TEST_EMAIL}`);
        console.log(`[INFO] Password: ${TEST_PASSWORD}`);
        console.log(`[INFO] This account will bypass OTP/TAC during login.`);
        await mongoose.disconnect();
        return;
      }
    }

    // Create new test member user
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
    const member = await User.create({
      name: TEST_NAME,
      email: TEST_EMAIL.toLowerCase(),
      passwordHash,
      role: 'member',
      emailVerifiedAt: new Date() // Auto-verify member
    });

    console.log('\n[SUCCESS] Test member account created successfully!');
    console.log('='.repeat(60));
    console.log('⚠️  TEST ACCOUNT - BYPASSES OTP/TAC ⚠️');
    console.log('='.repeat(60));
    console.log(`Email: ${member.email}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log(`Name: ${member.name}`);
    console.log(`Role: ${member.role}`);
    console.log('='.repeat(60));
    console.log('\n[INFO] This account will bypass OTP/TAC verification during login.');
    console.log('[INFO] This is for testing purposes only.\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[ERROR] Failed to create test member:', err.message);
    process.exit(1);
  }
}

createTestMember();


