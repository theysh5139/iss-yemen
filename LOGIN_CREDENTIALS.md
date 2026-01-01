# Login Credentials Guide

This document contains the default login credentials for testing the ISS Yemen web application.

## Default Credentials

### Admin Account
**Email:** `admin@issyemen.com`  
**Password:** `Admin123!`  
**Role:** Admin  
**Access:** Full admin dashboard access including:
- User management
- Event management
- HOD management
- Payment verification
- Chatbot management
- System settings

### Member Account
**Email:** `member@issyemen.com`  
**Password:** `Member123!`  
**Role:** Member  
**Access:** Member features including:
- Event registration
- Payment for events
- View HOD profiles
- Access to member-only events

## Creating New Accounts

### Create Admin Account
```bash
cd backend
npm run create-admin
```

Or with custom credentials:
```bash
npm run create-admin <email> <password> <name>
```

**Example:**
```bash
npm run create-admin admin@test.com MyPassword123 Admin Name
```

### Create Member Account
```bash
cd backend
npm run create-member
```

Or with custom credentials:
```bash
npm run create-member <email> <password> <name>
```

**Example:**
```bash
npm run create-member member@test.com MyPassword123 Member Name
```

## Test Accounts (Created by Seed Scripts)

When you run `npm run seed-registrations`, the following test member accounts are automatically created:

1. **Ahmed Al-Hashimi**
   - Email: `ahmed.member@test.com`
   - Password: `Test123!`
   - Role: Member

2. **Fatima Al-Salami**
   - Email: `fatima.member@test.com`
   - Password: `Test123!`
   - Role: Member

3. **Mohammed Al-Awadhi**
   - Email: `mohammed.member@test.com`
   - Password: `Test123!`
   - Role: Member

4. **Sara Al-Mansoori**
   - Email: `sara.member@test.com`
   - Password: `Test123!`
   - Role: Member

5. **Yusuf Al-Zahrani**
   - Email: `yusuf.member@test.com`
   - Password: `Test123!`
   - Role: Member

## Login Instructions

1. **Navigate to Login Page**
   - Go to `http://localhost:5173/login` (or your frontend URL)

2. **Enter Credentials**
   - Enter the email address
   - Enter the password
   - Click "Login" button

3. **OTP Verification (For Regular Users)**
   - Regular users (visitors) will receive an OTP via email
   - Enter the OTP to complete login
   - **Note:** Admin and Member accounts skip OTP verification for easier testing

4. **Access Dashboard**
   - After successful login, you'll be redirected to:
     - Admin: `/admin/dashboard`
     - Member: `/dashboard` (homepage with member features)

## Important Notes

### OTP Bypass
- **Admin** and **Member** roles bypass OTP verification for testing purposes
- **Visitor** role requires OTP verification

### Email Verification
- Admin and Member accounts created via scripts are automatically verified
- Regular signups require email verification

### Password Requirements
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Must contain at least one special character

### Security
⚠️ **Important:** These are default/test credentials. Change them in production!

## Troubleshooting

### Cannot Login
1. Verify the account exists in the database
2. Check if email is verified (for regular users)
3. Ensure MongoDB is running
4. Check backend server logs for errors

### OTP Not Received
- Check backend console for OTP code (in development mode)
- Verify email configuration in `.env`
- Admin/Member accounts don't require OTP

### Account Not Found
- Run the create scripts to generate accounts:
  ```bash
  cd backend
  npm run create-admin
  npm run create-member
  ```

## Quick Start Testing

1. **Start the servers:**
   ```bash
   npm run dev
   ```

2. **Create admin account (if not exists):**
   ```bash
   cd backend
   npm run create-admin
   ```

3. **Create member account (if not exists):**
   ```bash
   cd backend
   npm run create-member
   ```

4. **Login as Admin:**
   - Go to `http://localhost:5173/login`
   - Email: `admin@issyemen.com`
   - Password: `Admin123!`

5. **Login as Member:**
   - Go to `http://localhost:5173/login`
   - Email: `member@issyemen.com`
   - Password: `Member123!`

## Additional Resources

- See `TESTING_PAYMENT_REGISTRATION.md` for payment testing instructions
- See `CHATBOT_TESTING_GUIDE.md` for chatbot testing instructions
- See `README.md` for general setup instructions

