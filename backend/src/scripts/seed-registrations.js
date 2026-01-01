import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';
import { User } from '../models/User.model.js';
import { generateReceiptData } from '../utils/receipt.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function seedRegistrations() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    // Find events that require payment
    const eventsWithPayment = await Event.find({ 
      requiresPayment: true,
      paymentAmount: { $gt: 0 }
    }).limit(5);

    if (eventsWithPayment.length === 0) {
      console.log('[WARN] No events with payment found. Please seed events first using: npm run seed-events');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Find member users (or create test members if none exist)
    let members = await User.find({ role: 'member' }).limit(10);
    
    if (members.length === 0) {
      console.log('[WARN] No member users found. Creating test members...');
      // Create a few test members
      const testMembers = [
        { name: 'Ahmed Al-Hashimi', email: 'ahmed.member@test.com', password: 'Test123!', role: 'member', emailVerified: true },
        { name: 'Fatima Al-Salami', email: 'fatima.member@test.com', password: 'Test123!', role: 'member', emailVerified: true },
        { name: 'Mohammed Al-Awadhi', email: 'mohammed.member@test.com', password: 'Test123!', role: 'member', emailVerified: true },
        { name: 'Sara Al-Mansoori', email: 'sara.member@test.com', password: 'Test123!', role: 'member', emailVerified: true },
        { name: 'Yusuf Al-Zahrani', email: 'yusuf.member@test.com', password: 'Test123!', role: 'member', emailVerified: true }
      ];

      for (const memberData of testMembers) {
        try {
          const existing = await User.findOne({ email: memberData.email });
          if (!existing) {
            const member = new User(memberData);
            await member.save();
            console.log(`[CREATED] Test member: ${memberData.email}`);
          }
        } catch (err) {
          console.log(`[SKIP] Member ${memberData.email} already exists or error: ${err.message}`);
        }
      }

      members = await User.find({ role: 'member' }).limit(10);
    }

    if (members.length === 0) {
      console.log('[ERROR] Could not create or find any member users');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`[INFO] Found ${members.length} member(s) and ${eventsWithPayment.length} event(s) with payment`);

    let created = 0;
    let skipped = 0;

    // Register members for events with payment
    for (const event of eventsWithPayment) {
      // Register 2-4 members per event
      const numRegistrations = Math.min(Math.floor(Math.random() * 3) + 2, members.length);
      const selectedMembers = members.slice(0, numRegistrations);

      for (const member of selectedMembers) {
        try {
          // Check if already registered
          const isRegistered = event.registeredUsers.some(
            userId => userId.toString() === member._id.toString()
          );

          if (isRegistered) {
            console.log(`[SKIP] ${member.name} already registered for "${event.title}"`);
            skipped++;
            continue;
          }

          // Generate receipt data
          const receiptData = generateReceiptData(event, member, event.paymentAmount);

          // Add to registered users
          event.registeredUsers.push(member._id);
          event.attendees = event.registeredUsers.length;

          // Add detailed registration with payment receipt
          event.registrations.push({
            user: member._id,
            registeredAt: new Date(),
            paymentReceipt: {
              receiptNumber: receiptData.receiptNumber,
              generatedAt: receiptData.generatedAt,
              amount: receiptData.amount,
              paymentMethod: receiptData.paymentMethod,
              paymentStatus: 'Pending' // All start as Pending for admin to verify
            }
          });

          await event.save();
          console.log(`[CREATED] ${member.name} registered for "${event.title}" - Receipt: ${receiptData.receiptNumber} (RM ${receiptData.amount})`);
          created++;
        } catch (err) {
          console.error(`[ERROR] Failed to register ${member.name} for "${event.title}":`, err.message);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`[SUCCESS] Seeding completed!`);
    console.log(`Created: ${created} registrations with payment receipts`);
    console.log(`Skipped: ${skipped} registrations (already exist)`);
    console.log('='.repeat(50));
    console.log('\n[INFO] All payment receipts are set to "Pending" status.');
    console.log('[INFO] Admin can verify them in the "Verify Payments" page.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Failed to seed registrations:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedRegistrations();

