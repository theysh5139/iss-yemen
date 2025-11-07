# Email Configuration Guide

This guide explains how to set up email sending for the ISS Yemen Club backend.

## Quick Start

1. **For Development (Mock Mode - Default):**
   - No configuration needed
   - Emails are logged to console
   - Works out of the box

2. **For Real Email Sending:**
   - Set `EMAIL_MODE=real` in your `.env` file
   - Configure SMTP settings (see below)
   - Test using the test endpoints

## Environment Variables

Add these to your `backend/.env` file:

```env
# Email Mode: "mock" or "real"
EMAIL_MODE=mock

# SMTP Configuration (only needed if EMAIL_MODE=real)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=ISS Yemen Club
```

## Option 1: Gmail (Recommended for Testing)

### Steps:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security

2. **Create an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and enter "ISS Yemen Club"
   - Copy the 16-character app password

3. **Configure `.env`:**
   ```env
   EMAIL_MODE=real
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=your-email@gmail.com
   SMTP_FROM_NAME=ISS Yemen Club
   ```

4. **Important:** Use the **App Password**, NOT your regular Gmail password!

## Option 2: Mailtrap (Recommended for Development)

Mailtrap is a testing service that captures emails without sending them. Perfect for development!

### Steps:

1. **Sign up** at https://mailtrap.io (free tier available)

2. **Get SMTP credentials:**
   - Go to your Mailtrap inbox
   - Click "SMTP Settings"
   - Select "Nodemailer" from the dropdown
   - Copy the credentials

3. **Configure `.env`:**
   ```env
   EMAIL_MODE=real
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   SMTP_FROM=noreply@iss-yemen-club.com
   SMTP_FROM_NAME=ISS Yemen Club
   ```

4. **Test:** Emails will appear in your Mailtrap inbox instead of being sent

## Testing Email Configuration

### 1. Test SMTP Connection

```bash
# Using curl
curl http://localhost:5000/api/test/email-connection

# Or open in browser
http://localhost:5000/api/test/email-connection
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "SMTP connection verified successfully"
}
```

### 2. Send a Test Email

```bash
# Using curl
curl -X POST http://localhost:5000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Test email sent successfully! Check your inbox.",
  "result": {
    "success": true,
    "mode": "real",
    "messageId": "...",
    "response": "250 OK"
  }
}
```

## Troubleshooting

### Error: "EAUTH" (Authentication Error)

**Problem:** Invalid SMTP credentials

**Solutions:**
- For Gmail: Make sure you're using an App Password, not your regular password
- Verify `SMTP_USER` and `SMTP_PASS` are correct
- Check for extra spaces in your `.env` file

### Error: "ECONNECTION" or "ETIMEDOUT" (Connection Error)

**Problem:** Cannot connect to SMTP server

**Solutions:**
- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Check your internet connection
- Verify firewall isn't blocking the connection
- For Gmail: Port 587 should work (not 465 unless `SMTP_SECURE=true`)

### Error: "Email never arrives"

**Problem:** Email sending silently fails

**Solutions:**
- Check server logs for detailed error messages
- Verify `EMAIL_MODE=real` is set
- Test using the `/api/test/email` endpoint first
- Check spam folder
- For Mailtrap: Check your Mailtrap inbox (emails don't actually get sent)

### Mock Mode Still Active

**Problem:** Emails are still being logged instead of sent

**Solutions:**
- Verify `EMAIL_MODE=real` (not `EMAIL_MODE=mock`)
- Restart your backend server after changing `.env`
- Check that `.env` file is being loaded (check server startup logs)

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git
- Never share your SMTP passwords or App Passwords
- Use App Passwords for Gmail, not your main password
- In production, use environment variables from your hosting provider
- Consider using a dedicated email service (SendGrid, Mailgun) for production

## Production Recommendations

For production, consider:

1. **Dedicated Email Service:**
   - SendGrid (has free tier)
   - Mailgun
   - AWS SES
   - Postmark

2. **Environment Variables:**
   - Set `NODE_ENV=production`
   - Use hosting provider's environment variable system
   - Never hardcode credentials

3. **Rate Limiting:**
   - Already implemented in the auth routes
   - Consider additional rate limiting for email endpoints

## Need Help?

1. Check server logs for detailed error messages
2. Test SMTP connection using `/api/test/email-connection`
3. Send test email using `/api/test/email`
4. Verify all environment variables are set correctly
5. Make sure you restarted the server after changing `.env`

