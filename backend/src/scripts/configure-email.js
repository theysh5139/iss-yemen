import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { EmailConfig } from '../models/EmailConfig.model.js';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function configureEmail() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    // Get email config from command line arguments
    const provider = process.argv[2] || 'gmail';
    const email = process.argv[3];
    // Join all remaining arguments as password (in case it has spaces) and remove spaces
    const password = (process.argv.slice(4).join('') || process.argv[4] || '').replace(/\s/g, '');

    if (!email || !password) {
      console.log('Usage: node src/scripts/configure-email.js [provider] [email] [password/app-password]');
      console.log('\nExample (Gmail):');
      console.log('  node src/scripts/configure-email.js gmail your-email@gmail.com your-app-password');
      console.log('\nExample (SMTP):');
      console.log('  node src/scripts/configure-email.js smtp your-email@example.com your-password');
      console.log('\nFor Gmail, you need an App Password:');
      console.log('  1. Go to https://myaccount.google.com/apppasswords');
      console.log('  2. Sign in and create an app password');
      console.log('  3. Use that 16-digit password here\n');
      await mongoose.disconnect();
      return;
    }

    // Check if config exists
    let config = await EmailConfig.getActiveConfig();

    if (config) {
      // Update existing
      config.provider = provider;
      if (provider === 'gmail') {
        config.gmailUser = email;
        config.gmailAppPassword = password;
      } else {
        config.smtpUser = email;
        config.smtpPass = password;
        config.smtpHost = process.argv[5] || 'smtp.gmail.com';
        config.smtpPort = parseInt(process.argv[6]) || 587;
        config.smtpSecure = process.argv[7] === 'true' || false;
      }
      config.isActive = true;
      await config.save();
      console.log('✅ Email configuration updated!');
    } else {
      // Create new
      if (provider === 'gmail') {
        config = await EmailConfig.create({
          provider: 'gmail',
          gmailUser: email,
          gmailAppPassword: password,
          isActive: true
        });
      } else {
        config = await EmailConfig.create({
          provider: 'smtp',
          smtpHost: process.argv[5] || 'smtp.gmail.com',
          smtpPort: parseInt(process.argv[6]) || 587,
          smtpSecure: process.argv[7] === 'true' || false,
          smtpUser: email,
          smtpPass: password,
          smtpFrom: email,
          isActive: true
        });
      }
      console.log('✅ Email configuration created!');
    }

    // Activate this config
    await EmailConfig.setActiveConfig(config._id);

    console.log('\n📧 Email Configuration:');
    console.log('='.repeat(50));
    console.log(`Provider: ${config.provider}`);
    if (config.provider === 'gmail') {
      console.log(`Gmail User: ${config.gmailUser}`);
    } else {
      console.log(`SMTP Host: ${config.smtpHost}`);
      console.log(`SMTP User: ${config.smtpUser}`);
    }
    console.log(`Active: ${config.isActive}`);
    console.log('='.repeat(50));
    console.log('\n✅ Email is now configured! Try logging in to receive OTP.\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

configureEmail();

