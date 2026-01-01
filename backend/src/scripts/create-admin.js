import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    const email = process.argv[2] || 'admin@issyemen.com';
    const password = process.argv[3] || 'Admin123!';
    const name = process.argv[4] || 'Admin User';

    // Check if admin already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`[INFO] Admin user with email ${email} already exists with admin role.`);
        console.log(`[INFO] To change password, update the user in the database.`);
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to admin
        const passwordHash = await bcrypt.hash(password, 12);
        existing.role = 'admin';
        existing.passwordHash = passwordHash;
        existing.emailVerifiedAt = new Date(); // Auto-verify admin
        await existing.save();
        console.log(`[SUCCESS] Updated user ${email} to admin role.`);
        console.log(`[INFO] Email: ${email}`);
        console.log(`[INFO] Password: ${password}`);
        await mongoose.disconnect();
        return;
      }
    }

    // Create new admin user
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date() // Auto-verify admin
    });

    console.log('\n[SUCCESS] Admin user created successfully!');
    console.log('='.repeat(50));
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
    console.log('='.repeat(50));
    console.log('\nYou can now login with these credentials.\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[ERROR] Failed to create admin:', err.message);
    process.exit(1);
  }
}

createAdmin();


