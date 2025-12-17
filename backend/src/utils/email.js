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
async function getEmailConfig() {
  try {
    const config = await EmailConfig.getActiveConfig();
    if (!config) {
      console.log('[EMAIL] No email configuration found in MongoDB');
    } else if (!config.isActive) {
      console.log('[EMAIL] Email configuration exists but is not active');
    } else {
      console.log(`[EMAIL] Using ${config.provider} configuration for: ${config.gmailUser || config.smtpUser}`);
    }
    return config;
  } catch (error) {
    console.error('[EMAIL] Error fetching email config from MongoDB:', error.message);
    return null;
  }
}

/**
 * Create transporter from MongoDB configuration
 */
async function createTransporter() {
  // Check cache first
  const now = Date.now();
  if (cachedTransporter && lastConfigCheck && (now - lastConfigCheck) < CONFIG_CACHE_TTL) {
    return cachedTransporter;
  }

  const config = await getEmailConfig();
  
  if (!config || !config.isActive) {
    cachedTransporter = null;
    lastConfigCheck = now;
    return null;
  }

  let transporter = null;

  if (config.provider === 'gmail' && config.gmailUser && config.gmailAppPassword) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPassword
      }
    });
  } else if (config.provider === 'smtp' && config.smtpHost && config.smtpUser && config.smtpPass) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
  }

  // Update cache
  cachedTransporter = transporter;
  lastConfigCheck = now;
  
  return transporter;
}

/**
 * Invalidate transporter cache (call this when email config is updated)
 */
export function invalidateEmailCache() {
  cachedTransporter = null;
  lastConfigCheck = null;
}

/**
 * Send an email using nodemailer with credentials from MongoDB
 */
export async function sendEmail({ to, subject, text, html }) {
  const transporter = await createTransporter();

  // If transporter is not configured, log to console (development mode)
  if (!transporter) {
    console.log('='.repeat(60));
    console.log('[MOCK EMAIL - Email not configured in MongoDB]');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    if (html) {
      console.log('HTML:', html);
    }
    console.log('='.repeat(60));
    console.log('\n⚠️  To enable real email sending:');
    console.log('   1. Go to Admin Dashboard > Email Configuration');
    console.log('   2. Configure Gmail or SMTP settings');
    console.log('   3. Activate the configuration\n');
    return true;
  }

  try {
    const config = await getEmailConfig();
    const fromEmail = config?.smtpFrom || config?.gmailUser || 'noreply@iss-yemen.com';

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('   To:', to);
    console.log('   Subject:', subject);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    // Log to console as fallback
    console.log('='.repeat(60));
    console.log('[EMAIL FAILED - Logging to console]');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    if (html) {
      console.log('HTML:', html);
    }
    console.log('='.repeat(60));
    throw error;
  }
}
