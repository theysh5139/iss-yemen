# Gmail Setup Guide for OTP Emails

This guide will help you configure Gmail to send OTP emails to any user account.

## Step 1: Enable 2-Step Verification on Gmail

1. Go to https://myaccount.google.com/security
2. Sign in with your Gmail account
3. Under "Signing in to Google", find "2-Step Verification"
4. Click "Get Started" and follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - This is required to generate App Passwords

## Step 2: Generate Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. You'll see a page titled "App passwords"
4. Select:
   - **App**: Choose "Mail"
   - **Device**: Choose "Other (Custom name)"
   - **Name**: Enter "ISS Yemen App" (or any name you prefer)
5. Click "Generate"
6. **IMPORTANT**: Copy the 16-character password that appears
   - Format: `xxxx xxxx xxxx xxxx` (with spaces)
   - You'll need this password (remove spaces when using it)

## Step 3: Configure Email in MongoDB

Open your terminal in the project root and run:

```bash
cd backend
npm run configure-email gmail your-email@gmail.com your-app-password
```

**Example:**
```bash
npm run configure-email gmail luqmanhkmi07@gmail.com abcd efgh ijkl mnop
```

**Important:** 
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `your-app-password` with the 16-character password from Step 2
- Remove spaces from the app password when entering it

## Step 4: Verify Configuration

After running the command, you should see:
```
✅ Email configuration created!
📧 Email Configuration:
==================================================
Provider: gmail
Gmail User: your-email@gmail.com
Active: true
==================================================
✅ Email is now configured! Try logging in to receive OTP.
```

## Step 5: Test It

1. Make sure your backend is running (`npm run dev` in backend folder)
2. Try logging in with any user account
3. Check your backend terminal - you should see:
   ```
   [EMAIL] Using gmail configuration for: your-email@gmail.com
   ✅ Email sent successfully: <message-id>
   ```
4. The user should receive the OTP email in their inbox

## Troubleshooting

### "Less secure app access" error
- Gmail no longer supports "less secure apps"
- You MUST use App Passwords (Step 2 above)
- Regular Gmail password will NOT work

### "Invalid login" error
- Make sure you're using the App Password, not your regular Gmail password
- Verify the App Password is correct (no spaces)
- Check that 2-Step Verification is enabled

### Email not received
- Check spam/junk folder
- Verify the email address is correct
- Check backend terminal for error messages
- Make sure email config is active in MongoDB

### Still seeing "[MOCK EMAIL]" in logs
- Email configuration not saved to MongoDB
- Run the configure-email script again
- Check that `isActive: true` in the configuration

## How It Works

Once configured:
1. **Any user** logs in → System generates OTP
2. System fetches Gmail config from MongoDB
3. System sends OTP email using your Gmail account
4. User receives OTP in their email inbox
5. User enters OTP to complete login

The Gmail account you configure is used as the **sender** - all OTP emails will come from this account, but can be sent to **any user's email address**.






