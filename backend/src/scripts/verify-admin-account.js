import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function verifyAdminAccount() {
  try {
    console.log('\n🔍 Verifying Admin Account...\n');
    console.log('='.repeat(60));
    console.log(`MongoDB URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const adminEmail = 'admin@issyemen.com';
    const adminPassword = 'Admin123!';

    // Check if admin exists
    const admin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (!admin) {
      console.log('❌ Admin account not found!');
      console.log('\n📝 Creating admin account...\n');
      
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      const newAdmin = await User.create({
        name: 'Admin User',
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: 'admin',
        emailVerifiedAt: new Date()
      });

      console.log('✅ Admin account created successfully!');
      console.log('='.repeat(60));
      console.log(`Email: ${newAdmin.email}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role: ${newAdmin.role}`);
      console.log('='.repeat(60));
    } else {
      console.log('✅ Admin account found!');
      console.log('='.repeat(60));
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Email Verified: ${admin.isEmailVerified() ? 'Yes ✅' : 'No ❌'}`);
      
      // Verify password
      const passwordMatch = await bcrypt.compare(adminPassword, admin.passwordHash);
      if (passwordMatch) {
        console.log(`Password: ${adminPassword} ✅ (matches)`);
      } else {
        console.log(`Password: ${adminPassword} ❌ (does not match)`);
        console.log('\n⚠️  Password mismatch! Updating password...\n');
        
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        admin.passwordHash = passwordHash;
        admin.emailVerifiedAt = new Date();
        await admin.save();
        
        console.log('✅ Password updated successfully!');
        console.log(`New Password: ${adminPassword}`);
      }
      
      // Ensure email is verified
      if (!admin.isEmailVerified()) {
        console.log('\n⚠️  Email not verified! Verifying now...\n');
        admin.emailVerifiedAt = new Date();
        await admin.save();
        console.log('✅ Email verified!');
      }
      
      console.log('='.repeat(60));
    }

    console.log('\n📋 Login Credentials:');
    console.log('='.repeat(60));
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('='.repeat(60));
    console.log('\n✅ Admin account is ready for login!\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

verifyAdminAccount();
