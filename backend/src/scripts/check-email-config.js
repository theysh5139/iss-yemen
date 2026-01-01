import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { EmailConfig } from '../models/EmailConfig.model.js';
import { sendEmail } from '../utils/email.js';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/iss_yemen_club';

async function checkAndTestEmail() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB\n');

    // Check email config
    const config = await EmailConfig.getActiveConfig();
    
    if (!config) {
      console.log('❌ No email configuration found in MongoDB');
      console.log('   Run: npm run configure-email gmail your-email@gmail.com your-app-password');
      await mongoose.disconnect();
      return;
    }

    if (!config.isActive) {
      console.log('⚠️  Email configuration exists but is not active');
      console.log('   Setting it to active...');
      config.isActive = true;
      await config.save();
    }

    console.log('✅ Email Configuration Found:');
    console.log('='.repeat(50));
    console.log(`Provider: ${config.provider}`);
    if (config.provider === 'gmail') {
      console.log(`Gmail User: ${config.gmailUser}`);
      console.log(`App Password: ${config.gmailAppPassword ? '***' + config.gmailAppPassword.slice(-4) : 'NOT SET'}`);
    } else {
      console.log(`SMTP Host: ${config.smtpHost}`);
      console.log(`SMTP User: ${config.smtpUser}`);
    }
    console.log(`Active: ${config.isActive}`);
    console.log('='.repeat(50));

    // Test email
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`\n📧 Testing email to: ${testEmail}`);
      console.log('Sending test email...\n');
      
      try {
        await sendEmail({
          to: testEmail,
          subject: 'ISS Yemen - Email Configuration Test',
          text: 'This is a test email. If you receive this, your email configuration is working correctly!',
          html: '<p>This is a test email.</p><p>If you receive this, your email configuration is working correctly!</p>'
        });
        console.log('✅ Test email sent! Check your inbox (and spam folder).');
      } catch (error) {
        console.error('❌ Error sending test email:', error.message);
        console.error('   Full error:', error);
      }
    } else {
      console.log('\n💡 To test email, run:');
      console.log('   node src/scripts/check-email-config.js your-email@gmail.com');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAndTestEmail();






