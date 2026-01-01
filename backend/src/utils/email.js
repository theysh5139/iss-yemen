import nodemailer from 'nodemailer';
import { EmailConfig } from '../models/EmailConfig.model.js';

// Cache transporter to avoid recreating it on every email
let cachedTransporter = null;
let lastConfigCheck = null;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Export function to clear cache (useful after config changes)
export function clearEmailCache() {
  cachedTransporter = null;
  lastConfigCheck = null;
  console.log('[EMAIL] Cache cleared');
}

/**
 * Get active email configuration from MongoDB
 */
async function getActiveEmailConfig() {
  // Check cache first
  if (cachedTransporter && lastConfigCheck && (Date.now() - lastConfigCheck) < CONFIG_CACHE_TTL) {
    return cachedTransporter;
  }

  const config = await EmailConfig.getActiveConfig();
  if (!config) {
    console.log('[EMAIL] No active email configuration found');
    cachedTransporter = null;
    lastConfigCheck = Date.now();
    return null;
  }

  // Create transporter from config
  const transporterConfig = {
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  };

  cachedTransporter = nodemailer.createTransporter(transporterConfig);
  lastConfigCheck = Date.now();

  console.log('[EMAIL] Created new transporter from DB config');
  return cachedTransporter;
}

/**
 * Send email using database configuration
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = await getActiveEmailConfig();
    if (!transporter) {
      console.log('[EMAIL] No email configuration - logging email instead');
      console.log('='.repeat(60));
      console.log('EMAIL NOT SENT (no config):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text);
      if (html) {
        console.log('HTML:', html);
      }
      console.log('='.repeat(60));
      return { success: false, message: 'No email configuration' };
    }

    const mailOptions = {
      from: `"${config.smtpFromName || 'ISS Yemen'}" <${config.smtpFrom || config.smtpUser}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error.message);
    console.log('='.repeat(60));
    console.log('EMAIL FAILED - logging instead:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    if (html) {
      console.log('HTML:', html);
    }
    console.log('Error:', error.message);
    console.log('='.repeat(60));
    throw error;
  }
}

/**
 * Test email connection
 */
export async function testEmailConnection() {
  try {
    const transporter = await getActiveEmailConfig();
    if (!transporter) {
      console.log('[EMAIL] No email configuration to test');
      return false;
    }

    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL] SMTP connection test failed:', error.message);
    return false;
  }
}

// Export function to invalidate cache (useful after config changes)
export function invalidateEmailCache() {
  cachedTransporter = null;
  lastConfigCheck = null;
  console.log('[EMAIL] Cache invalidated');
}
