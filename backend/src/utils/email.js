import nodemailer from 'nodemailer';

/**
 * Email Service Configuration
 * 
 * This service supports two modes:
 * 1. MOCK MODE (development): Logs emails to console instead of sending
 * 2. REAL MODE (production/testing): Sends actual emails via SMTP
 * 
 * To use real email:
 * - Set EMAIL_MODE=real in your .env
 * - Configure SMTP settings (see .env.example)
 * 
 * For Gmail:
 * - Use an App Password (not your regular password)
 * - SMTP_HOST=smtp.gmail.com
 * - SMTP_PORT=587
 * - SMTP_SECURE=false
 * - SMTP_USER=your-email@gmail.com
 * - SMTP_PASS=your-app-password
 * 
 * For Mailtrap (testing):
 * - Sign up at mailtrap.io (free tier available)
 * - Copy SMTP credentials from their dashboard
 * - Use those in your .env
 */

// Determine email mode: 'mock' or 'real'
const EMAIL_MODE = (process.env.EMAIL_MODE || 'mock').toLowerCase();
const USE_REAL_EMAIL = EMAIL_MODE === 'real';

// SMTP Configuration (only used in real mode)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// Email sender address
const FROM_EMAIL = process.env.SMTP_FROM || SMTP_CONFIG.auth.user || 'noreply@iss-yemen-club.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'ISS Yemen Club';

// Create transporter (only in real mode)
let transporter = null;

if (USE_REAL_EMAIL) {
  // Validate that we have required SMTP credentials
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    console.error('⚠️  EMAIL ERROR: Real email mode is enabled but SMTP_USER or SMTP_PASS is missing!');
    console.error('   Falling back to mock mode. Set EMAIL_MODE=mock or provide SMTP credentials.');
  } else {
    try {
      // Create transporter with SMTP settings
      transporter = nodemailer.createTransport({
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        secure: SMTP_CONFIG.secure,
        auth: {
          user: SMTP_CONFIG.auth.user,
          pass: SMTP_CONFIG.auth.pass
        },
        // Additional options for better error handling
        tls: {
          rejectUnauthorized: false // Set to true in production with valid certificates
        }
      });

      // Verify transporter connection (async, but we'll catch errors when sending)
      transporter.verify((error, success) => {
        if (error) {
          console.error('⚠️  SMTP Connection Error:', error.message);
          console.error('   Check your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env');
        } else {
          console.log('✅ SMTP transporter configured successfully');
          console.log(`   Host: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`);
          console.log(`   From: ${FROM_NAME} <${FROM_EMAIL}>`);
        }
      });
    } catch (error) {
      console.error('⚠️  Failed to create email transporter:', error.message);
      transporter = null;
    }
  }
} else {
  console.log('📧 Email service running in MOCK mode (emails logged to console)');
  console.log('   Set EMAIL_MODE=real in .env to enable real email sending');
}

/**
 * Send an email (mock or real based on EMAIL_MODE)
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body (optional)
 * @returns {Promise<Object>} - Result object with success status and details
 */
export async function sendEmail({ to, subject, text, html }) {
  // Input validation
  if (!to || !subject || (!text && !html)) {
    const error = new Error('Missing required email fields: to, subject, and text/html are required');
    console.error('❌ Email validation error:', error.message);
    throw error;
  }

  // Mock mode: just log to console
  if (!USE_REAL_EMAIL || !transporter) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 [MOCK EMAIL]');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('To:', to);
    console.log('Subject:', subject);
    if (text) console.log('Text:', text);
    if (html) {
      // Extract the link from HTML for easy copy-paste
      const linkMatch = html.match(/href="([^"]+)"/);
      if (linkMatch) {
        console.log('Link:', linkMatch[1]);
      }
      console.log('HTML:', html);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return {
      success: true,
      mode: 'mock',
      message: 'Email logged to console (mock mode)'
    };
  }

  // Real mode: send actual email
  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text // Use HTML if provided, otherwise use text
    };

    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`   Subject: ${subject}`);

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    
    return {
      success: true,
      mode: 'real',
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    // Detailed error logging
    console.error('\n❌ EMAIL SENDING FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('To:', to);
    console.error('Subject:', subject);
    console.error('Error:', error.message);
    
    // Provide helpful error messages based on common issues
    if (error.code === 'EAUTH') {
      console.error('\n💡 This is an authentication error. Check:');
      console.error('   - SMTP_USER is correct');
      console.error('   - SMTP_PASS is correct (use App Password for Gmail)');
      console.error('   - For Gmail: Enable 2FA and create an App Password');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 This is a connection error. Check:');
      console.error('   - SMTP_HOST is correct');
      console.error('   - SMTP_PORT is correct (587 for Gmail, 465 for secure)');
      console.error('   - Your internet connection');
      console.error('   - Firewall is not blocking the connection');
    } else if (error.code === 'EENVELOPE') {
      console.error('\n💡 This is an envelope error. Check:');
      console.error('   - "to" email address is valid');
      console.error('   - "from" email address is valid');
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Re-throw the error so the caller can handle it
    throw error;
  }
}

/**
 * Test email transporter connection
 * This is useful for debugging SMTP configuration
 * 
 * @returns {Promise<boolean>} - True if connection is successful
 */
export async function testEmailConnection() {
  if (!USE_REAL_EMAIL || !transporter) {
    console.log('ℹ️  Email is in mock mode, no connection to test');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection test failed:', error.message);
    return false;
  }
}
