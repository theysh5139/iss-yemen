import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function createMember() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    const email = process.argv[2] || 'member@issyemen.com';
    const password = process.argv[3] || 'Member123!';
    const name = process.argv[4] || 'Member User';

    // Check if member already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.role === 'member') {
        console.log(`[INFO] Member user with email ${email} already exists.`);
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to member
        const passwordHash = await bcrypt.hash(password, 12);
        existing.role = 'member';
        existing.passwordHash = passwordHash;
        existing.emailVerifiedAt = new Date(); // Auto-verify member
        await existing.save();
        console.log(`[SUCCESS] Updated user ${email} to member role.`);
        console.log(`[INFO] Email: ${email}`);
        console.log(`[INFO] Password: ${password}`);
        await mongoose.disconnect();
        return;
      }
    }

    // Create new member user
    const passwordHash = await bcrypt.hash(password, 12);
    const member = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'member',
      emailVerifiedAt: new Date() // Auto-verify member
    });

    console.log('\n[SUCCESS] Member user created successfully!');
    console.log('='.repeat(50));
    console.log(`Email: ${member.email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${member.name}`);
    console.log(`Role: ${member.role}`);
    console.log('='.repeat(50));
    console.log('\nYou can now login with these credentials.\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[ERROR] Failed to create member:', err.message);
    process.exit(1);
  }
}

createMember();


