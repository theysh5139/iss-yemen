import { sendEmail, testEmailConnection } from '../utils/email.js';

/**
 * Test Email Endpoint
 * 
 * This endpoint allows you to test email sending without going through
 * the full authentication flow. Useful for debugging SMTP configuration.
 * 
 * POST /api/test/email
 * Body: { to: "your-email@example.com" }
 * 
 * GET /api/test/email-connection
 * Tests SMTP connection without sending an email
 */
export async function testEmail(req, res, next) {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        message: 'Missing required field: to',
        example: { to: 'your-email@example.com' }
      });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        provided: to
      });
    }

    console.log('\n🧪 TEST EMAIL REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('To:', to);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const testSubject = 'Test Email from ISS Yemen Club';
    const testText = `This is a test email from your ISS Yemen Club backend.
    
If you received this email, your email configuration is working correctly!

Time sent: ${new Date().toISOString()}
Server: ${process.env.SERVER_BASE_URL || 'http://localhost:5000'}`;

    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Test Email from ISS Yemen Club</h2>
        <p>This is a test email from your ISS Yemen Club backend.</p>
        <p>If you received this email, your email configuration is working correctly! ✅</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          <strong>Time sent:</strong> ${new Date().toISOString()}<br>
          <strong>Server:</strong> ${process.env.SERVER_BASE_URL || 'http://localhost:5000'}
        </p>
      </div>
    `;

    try {
      const result = await sendEmail({
        to: to,
        subject: testSubject,
        text: testText,
        html: testHtml
      });

      return res.json({
        success: true,
        message: result.mode === 'mock' 
          ? 'Test email logged to console (mock mode). Set EMAIL_MODE=real to send real emails.'
          : 'Test email sent successfully! Check your inbox.',
        result: result
      });
    } catch (emailError) {
      console.error('Test email failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: emailError.message,
        hint: 'Check server logs for detailed error information. Verify your SMTP configuration in .env'
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Test SMTP Connection
 * 
 * This endpoint verifies that the SMTP transporter can connect
 * to the email server without actually sending an email.
 */
export async function testEmailConnectionEndpoint(req, res, next) {
  try {
    const connectionOk = await testEmailConnection();
    
    if (connectionOk) {
      return res.json({
        success: true,
        message: 'SMTP connection verified successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'SMTP connection test failed or email is in mock mode',
        hint: 'Check your SMTP configuration in .env and ensure EMAIL_MODE=real'
      });
    }
  } catch (err) {
    next(err);
  }
}

