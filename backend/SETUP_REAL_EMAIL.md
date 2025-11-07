# Setup Real Email Verification - Step by Step Guide

## Quick Setup for Gmail (Real Emails)

### Step 1: Get Gmail App Password

1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Turn on "2-Step Verification" if not already enabled

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" and enter: `ISS Yemen Club`
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - **Important:** Remove spaces when using it → `abcdefghijklmnop`

### Step 2: Update Your .env File

Open `backend/.env` and add/replace these lines:

```env
# Email Configuration - REAL MODE
EMAIL_MODE=real

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password-no-spaces
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=ISS Yemen Club
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `your-16-character-app-password-no-spaces` with the app password (remove spaces!)

### Step 3: Restart Your Backend Server

1. Stop your backend server (Ctrl+C in the terminal)
2. Start it again: `npm run dev`
3. Look for this message in the console:
   ```
   ✅ SMTP transporter configured successfully
      Host: smtp.gmail.com:587
      From: ISS Yemen Club <your-email@gmail.com>
   ```

### Step 4: Test It!

1. **Test Connection:**
   - Open: http://localhost:5000/api/test/email-connection
   - Should show: `{"success": true}`

2. **Send Test Email:**
   - Use the test script: `.\test-email.ps1 your-email@gmail.com`
   - Or use Postman/curl
   - Check your inbox for the test email!

3. **Test Full Flow:**
   - Sign up a new user via your frontend
   - Check your email inbox for verification link
   - Click the link to verify
   - Try logging in!

---

## Troubleshooting

### ❌ Error: "EAUTH" (Authentication Failed)
- **Solution:** Make sure you're using the App Password, NOT your regular Gmail password
- Remove all spaces from the app password
- Verify 2-Factor Authentication is enabled

### ❌ Error: "ECONNECTION" 
- **Solution:** Check your internet connection
- Verify SMTP_HOST and SMTP_PORT are correct
- Try restarting your backend server

### ❌ Still seeing mock mode
- **Solution:** 
  - Make sure `EMAIL_MODE=real` (not `mock`)
  - Restart backend server after changing .env
  - Check server console for error messages

### ✅ Success Indicators
- Console shows: `✅ SMTP transporter configured successfully`
- `/api/test/email-connection` returns `{"success": true}`
- Test email arrives in your inbox

---

## Alternative: Mailtrap (For Testing)

If you want to test without sending real emails:

1. Sign up at: https://mailtrap.io (free)
2. Get SMTP credentials from their dashboard
3. Use these settings in .env:

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

Emails will appear in Mailtrap inbox (they won't be sent to real users).

