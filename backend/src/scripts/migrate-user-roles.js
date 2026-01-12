/**
 * Migration script to remove 'user' role and migrate users to 'member' role
 * Run this script once to migrate existing users with 'user' role to 'member'
 * 
 * Usage: node backend/src/scripts/migrate-user-roles.js
 */

import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

async function migrateUserRoles() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iss-yemen';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all users with 'user' role
    const usersToMigrate = await User.find({ role: 'user' });
    console.log(`Found ${usersToMigrate.length} users with 'user' role to migrate`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users to migrate');
      await mongoose.disconnect();
      return;
    }

    // Migrate all 'user' role to 'member' role
    const result = await User.updateMany(
      { role: 'user' },
      { $set: { role: 'member' } }
    );

    console.log(`✅ Successfully migrated ${result.modifiedCount} users from 'user' to 'member' role`);

    // Verify migration
    const remainingUsers = await User.find({ role: 'user' });
    if (remainingUsers.length > 0) {
      console.warn(`⚠️  Warning: ${remainingUsers.length} users still have 'user' role`);
    } else {
      console.log('✅ All users have been migrated successfully');
    }

    await mongoose.disconnect();
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserRoles();


