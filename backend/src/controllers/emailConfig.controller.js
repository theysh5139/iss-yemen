import { EmailConfig } from '../models/EmailConfig.model.js';
import { invalidateEmailCache, clearEmailCache } from '../utils/email.js';

/**
 * Get email configuration (admin only)
 */
export async function getEmailConfig(req, res, next) {
  try {
    const config = await EmailConfig.getActiveConfig();
    
    if (!config) {
      return res.json({ 
        config: null,
        message: 'No email configuration found. Please configure email settings.'
      });
    }

    // Don't send sensitive password fields
    const safeConfig = {
      _id: config._id,
      provider: config.provider,
      gmailUser: config.gmailUser,
      // Don't send password
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure,
      smtpUser: config.smtpUser,
      smtpFrom: config.smtpFrom,
      // Don't send password
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };

    return res.json({ config: safeConfig });
  } catch (err) {
    next(err);
  }
}

/**
 * Create or update email configuration (admin only)
 */
export async function saveEmailConfig(req, res, next) {
  try {
    const {
      provider,
      gmailUser,
      gmailAppPassword,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFrom,
      isActive
    } = req.body;

    // Validate provider
    if (provider && !['gmail', 'smtp'].includes(provider)) {
      return res.status(400).json({ message: 'Provider must be "gmail" or "smtp"' });
    }

    // Validate Gmail config
    if (provider === 'gmail') {
      if (!gmailUser || !gmailAppPassword) {
        return res.status(400).json({ 
          message: 'Gmail configuration requires gmailUser and gmailAppPassword' 
        });
      }
    }

    // Validate SMTP config
    if (provider === 'smtp') {
      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(400).json({ 
          message: 'SMTP configuration requires smtpHost, smtpUser, and smtpPass' 
        });
      }
    }

    // Get existing active config or create new one
    let config = await EmailConfig.getActiveConfig();
    
    if (config) {
      // Update existing config
      if (provider) config.provider = provider;
      if (gmailUser !== undefined) config.gmailUser = gmailUser;
      if (gmailAppPassword !== undefined) config.gmailAppPassword = gmailAppPassword;
      if (smtpHost !== undefined) config.smtpHost = smtpHost;
      if (smtpPort !== undefined) config.smtpPort = smtpPort;
      if (smtpSecure !== undefined) config.smtpSecure = smtpSecure;
      if (smtpUser !== undefined) config.smtpUser = smtpUser;
      if (smtpPass !== undefined) config.smtpPass = smtpPass;
      if (smtpFrom !== undefined) config.smtpFrom = smtpFrom;
      if (isActive !== undefined) config.isActive = isActive;
      
      await config.save();
    } else {
      // Create new config
      config = await EmailConfig.create({
        provider: provider || 'gmail',
        gmailUser,
        gmailAppPassword,
        smtpHost,
        smtpPort: smtpPort || 587,
        smtpSecure: smtpSecure || false,
        smtpUser,
        smtpPass,
        smtpFrom,
        isActive: isActive !== undefined ? isActive : true
      });
    }

    // If activating this config, deactivate others
    if (config.isActive) {
      await EmailConfig.setActiveConfig(config._id);
    }

    // Clear email cache so new config is used immediately
    clearEmailCache();

    // Return config without sensitive data
    const safeConfig = {
      _id: config._id,
      provider: config.provider,
      gmailUser: config.gmailUser,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure,
      smtpUser: config.smtpUser,
      smtpFrom: config.smtpFrom,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };

    return res.json({ 
      message: 'Email configuration saved successfully',
      config: safeConfig
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * Test email configuration (admin only)
 */
export async function testEmailConfig(req, res, next) {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ message: 'testEmail is required' });
    }

    const { sendEmail } = await import('../utils/email.js');
    
    await sendEmail({
      to: testEmail,
      subject: 'ISS Yemen - Email Configuration Test',
      text: 'This is a test email from ISS Yemen. Your email configuration is working correctly!',
      html: '<p>This is a test email from ISS Yemen.</p><p>Your email configuration is working correctly!</p>'
    });

    return res.json({ message: 'Test email sent successfully' });
  } catch (err) {
    return res.status(500).json({ 
      message: 'Failed to send test email: ' + err.message 
    });
  }
}

