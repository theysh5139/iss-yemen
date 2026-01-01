# Detailed Gmail App Password Setup

## Step-by-Step with Screenshots Description

### Step 1: Go to App Passwords Page
1. Open your web browser
2. Go to: **https://myaccount.google.com/apppasswords**
3. Sign in with your Gmail account

### Step 2: Understanding the App Passwords Page

When you arrive at the App Passwords page, you'll see:

**If 2-Step Verification is NOT enabled:**
- You'll see a message saying "2-Step Verification needs to be turned on"
- Click the link to enable it first
- You'll need to verify your phone number

**If 2-Step Verification IS enabled:**
- You'll see a form with dropdown menus

### Step 3: Fill Out the Form

You'll see two dropdown menus:

**First Dropdown - "Select app":**
- Click the dropdown
- You'll see options like:
  - Mail
  - Calendar
  - Contacts
  - Other (Custom name)
- **Select "Mail"** ← This is what I meant by "App: Mail"

**Second Dropdown - "Select device":**
- Click the dropdown
- You'll see options like:
  - Windows Computer
  - Mac
  - iPhone
  - Android Phone
  - Other (Custom name)
- **Select "Other (Custom name)"** ← Choose this option

**Text Field - "Enter name":**
- A text box will appear
- Type: **"ISS Yemen App"** (or any name you want)
- This is just a label to remember what this password is for

### Step 4: Generate Password

1. Click the **"Generate"** button
2. Google will show you a 16-character password
3. **IMPORTANT**: Copy this password immediately
   - It looks like: `abcd efgh ijkl mnop` (with spaces)
   - Or: `abcdefghijklmnop` (without spaces)
   - Both formats work, but you'll use it without spaces

### Alternative: If You Don't See "Mail" Option

Some Google accounts show a different interface. If you see:
- A text field asking "Which app are you using?"
- Type: **"Mail"** or **"Email"**

Or if you see:
- A dropdown with "Other" as the only option
- Select "Other" and type "Mail" in the name field

## Visual Guide (What You'll See)

```
┌─────────────────────────────────────────┐
│  App passwords                          │
├─────────────────────────────────────────┤
│  Select app: [Mail ▼]                   │
│  Select device: [Other (Custom name) ▼] │
│  Enter name: [ISS Yemen App        ]    │
│                                         │
│  [Generate]                             │
└─────────────────────────────────────────┘
```

## Common Questions

**Q: What if I don't see "Mail" in the dropdown?**
A: Select "Other (Custom name)" and type "Mail" in the name field

**Q: What if the interface looks different?**
A: Google sometimes updates their interface. Look for:
   - A dropdown to select an app/service
   - A field to enter a device name
   - A "Generate" button

**Q: Do I need to select a specific device?**
A: No, you can select "Other (Custom name)" and give it any name. The password will work from any device.

**Q: Can I use this password on multiple devices?**
A: Yes! Once generated, this App Password works from any device or location.

## After Generating the Password

Once you have the 16-character password:
1. Copy it (you won't see it again!)
2. Use it in the configure command:
   ```bash
   npm run configure-email gmail your-email@gmail.com your-16-char-password
   ```

That's it! The password will be stored in MongoDB and used automatically for all OTP emails.






