# Quick Email Setup Guide 🚀

Follow these steps to get real email working in 5 minutes!

## Option 1: Mailtrap (Recommended - Easiest for Testing) 📧

### Step 1: Create Mailtrap Account (2 minutes)
1. Go to: https://mailtrap.io
2. Click "Sign Up" (free account works great!)
3. Verify your email

### Step 2: Get SMTP Credentials (1 minute)
1. After logging in, you'll see your inbox
2. Click on "SMTP Settings" (or find it in the left sidebar)
3. Select "Nodemailer" from the dropdown
4. You'll see something like:
   ```
   Host: smtp.mailtrap.io
   Port: 2525
   Username: abc123def456
   Password: xyz789uvw012
   ```

### Step 3: Update Your .env File (1 minute)
1. Open `backend/.env` in your editor
2. Find the Mailtrap section (it's commented out)
3. Uncomment and fill in your credentials:
   ```env
   EMAIL_MODE=real
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=abc123def456
   SMTP_PASS=xyz789uvw012
   SMTP_FROM=noreply@iss-yemen-club.com
   SMTP_FROM_NAME=ISS Yemen Club
   ```
4. Save the file

### Step 4: Restart Backend Server
1. Stop your backend server (Ctrl+C)
2. Start it again: `npm run dev`
3. Look for this message in the console:
   ```
   ✅ SMTP transporter configured successfully
      Host: smtp.mailtrap.io:2525
      From: ISS Yemen Club <noreply@iss-yemen-club.com>
   ```

### Step 5: Test It! (1 minute)
1. Open: http://localhost:5000/api/test/email-connection
   - Should show: `{"success": true}`
   
2. Send a test email (use PowerShell):
   ```powershell
   $body = @{to="test@example.com"} | ConvertTo-Json
   Invoke-RestMethod -Uri "http://localhost:5000/api/test/email" -Method POST -Body $body -ContentType "application/json"
   ```
   
3. Check your Mailtrap inbox - you should see the test email! 🎉

---

## Option 2: Gmail (For Real Emails) 📬

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

### Step 2: Create App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as device, enter "ISS Yemen Club"
4. Click "Generate"
5. Copy the 16-character password (it looks like: `abcd efgh ijkl mnop`)

### Step 3: Update Your .env File
```env
EMAIL_MODE=real
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=ISS Yemen Club
```

**Important:** 
- Use the App Password, NOT your regular Gmail password
- Remove spaces from the app password: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### Step 4: Restart and Test
Same as Step 4-5 above!

---

## Testing Your Email Setup

### Test 1: Check Connection
```
GET http://localhost:5000/api/test/email-connection
```

### Test 2: Send Test Email
```powershell
# PowerShell
$body = @{to="your-email@example.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/test/email" -Method POST -Body $body -ContentType "application/json"
```

Or use Postman/Insomnia:
```
POST http://localhost:5000/api/test/email
Body: { "to": "your-email@example.com" }
```

### Test 3: Full Signup Flow
1. Sign up a new user via your frontend
2. Check your Mailtrap inbox (or email inbox if using Gmail)
3. Click the verification link
4. Try logging in!

---

## Troubleshooting

### ❌ "EAUTH" Error
- **Gmail:** Make sure you're using App Password, not regular password
- **Mailtrap:** Double-check username and password

### ❌ "ECONNECTION" Error  
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Make sure backend server restarted after changing .env

### ❌ Still in Mock Mode
- Verify `EMAIL_MODE=real` (not `EMAIL_MODE=mock`)
- Restart backend server
- Check server console for error messages

### ✅ Success Indicators
- Console shows: `✅ SMTP transporter configured successfully`
- `/api/test/email-connection` returns `{"success": true}`
- Test email arrives in Mailtrap inbox or your email

---

## Need Help?

1. Check server logs for detailed error messages
2. Verify all environment variables in `.env`
3. Make sure you restarted the server after changes
4. Test with `/api/test/email` endpoint first

Happy coding! 🎉

