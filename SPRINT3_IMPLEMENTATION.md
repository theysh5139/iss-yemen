# Sprint 3 Implementation - MFA Secure Login

## Overview

This document describes the complete implementation of Sprint 3 backlog items:
- **U12** - MFA Secure Login
- **U13** - OTP Expiration (60 seconds)
- **U14** - Invalid OTP Error with Lockout

---

## ✅ U12 – MFA Secure Login

### User Story
"As a member, I want secure login using Multi-Factor Authentication (MFA) for added protection."

### Implementation Details

#### Backend Changes

**1. User Model (`backend/src/models/User.model.js`)**
- Added MFA fields:
  - `otp`: Hashed OTP (String)
  - `otpExpires`: OTP expiration timestamp (Date)
  - `failedOtpAttempts`: Counter for failed attempts (Number, default: 0)
  - `lockoutUntil`: Lockout timestamp after 3 failed attempts (Date)

**2. Token Utilities (`backend/src/utils/tokens.js`)**
- Added `generateOTP()`: Generates a 6-digit OTP
- Added `addSeconds()`: Helper for time calculations

**3. Login Controller (`backend/src/controllers/auth.controller.js`)**
- Modified `login()` function:
  - Validates email and password
  - Checks email verification status
  - Checks for account lockout
  - Generates 6-digit OTP
  - Hashes OTP using SHA-256
  - Sets OTP expiration to 60 seconds from now
  - Sends OTP via email using Nodemailer
  - Returns email (and dev OTP in non-production mode)
  - Does NOT issue JWT token directly

**4. Verify OTP Controller (`backend/src/controllers/auth.controller.js`)**
- New `verifyOTP()` function:
  - Validates email and OTP
  - Checks account lockout status
  - Validates OTP expiration (U13)
  - Compares hashed OTP
  - Handles failed attempts (U14)
  - Issues JWT token only after successful OTP verification

**5. Validation Schema (`backend/src/middlewares/validators.js`)**
- Added `verifyOtpSchema`:
  - Email: Required, valid email format
  - OTP: Required, exactly 6 digits (regex: `/^\d{6}$/`)

**6. Routes (`backend/src/routes/auth.routes.js`)**
- Added `POST /api/auth/verify-otp` route with validation middleware

#### Frontend Changes

**1. API Client (`frontend/src/api/auth.js`)**
- Added `verifyOtpApi(payload)`: Sends OTP verification request

**2. Login Page (`frontend/src/pages/Login.jsx`)**
- Modified to redirect to `/verify-otp` after successful login request
- Passes email and dev OTP (if available) via `location.state`

**3. Verify OTP Page (`frontend/src/pages/VerifyOTP.jsx`)**
- New component with:
  - 6-digit OTP input (numeric only, auto-focus)
  - Real-time countdown timer showing OTP expiration (U13)
  - Error display for invalid OTP (U14)
  - Lockout countdown display
  - Dev mode OTP display (non-production)
  - Redirects to dashboard on success
  - Redirects to login if no email in state

**4. App Routes (`frontend/src/App.jsx`)**
- Added route: `/verify-otp` → `<VerifyOTP />`

---

## ✅ U13 – OTP Expiration

### User Story
"As a member, I want the OTP to expire after 60 seconds."

### Implementation Details

#### Backend
- OTP expiration set to 60 seconds from generation:
  ```javascript
  const otpExpires = addSeconds(new Date(), 60);
  ```
- `verifyOTP()` checks expiration before validation:
  ```javascript
  if (user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'OTP has expired...' });
  }
  ```

#### Frontend
- Countdown timer in `VerifyOTP.jsx`:
  - Starts at 60 seconds
  - Decrements every second
  - Shows formatted time (MM:SS)
  - Disables form when expired
  - Shows expiration message

---

## ✅ U14 – Invalid OTP Error

### User Story
"As a member, I want to see an error message when entering an incorrect OTP."

### Implementation Details

#### Backend
- **Error Messages**:
  - Invalid OTP: Shows attempts remaining (3, 2, 1)
  - After 3 failed attempts: Locks account for 30 seconds
  - Lockout message includes remaining lockout time

- **Lockout Logic**:
  - Increments `failedOtpAttempts` on each failed attempt
  - When `failedOtpAttempts >= 3`:
    - Sets `lockoutUntil = now + 30 seconds`
    - Returns 429 status with lockout message
  - Resets counters on successful OTP verification or new OTP generation

#### Frontend
- **Error Display**:
  - Shows error message in red error box
  - Different styling for lockout errors
  - Displays attempts remaining for invalid OTP
  - Shows lockout countdown timer (MM:SS)
- **User Experience**:
  - Clears OTP input on error (security)
  - Disables form during lockout
  - Shows appropriate button states

---

## 🔐 Security Considerations

1. **OTP Hashing**: OTP is hashed using SHA-256 before storage
2. **OTP Expiration**: Automatic expiration after 60 seconds
3. **Brute Force Protection**: 3 failed attempts → 30 second lockout
4. **Lockout Status**: Checked before OTP validation
5. **Secure Storage**: OTP never sent in API responses (except dev mode)
6. **JWT Only After MFA**: JWT token issued only after successful OTP verification
7. **Input Validation**: Strict 6-digit numeric validation

---

## 📋 API Design

### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (Success):**
```json
{
  "message": "OTP sent to your email. Please verify to complete login.",
  "email": "user@example.com",
  "devOtp": "123456" // Only in non-production mode
}
```

**Response (Error):**
```json
{
  "message": "Invalid email or password"
}
```

**Response (Lockout):**
```json
{
  "message": "Account temporarily locked. Please try again in 30 seconds.",
  "lockoutSeconds": 30
}
```

---

### POST /api/auth/verify-otp
**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```
*Note: Sets HTTP-only cookie with JWT token*

**Response (Invalid OTP):**
```json
{
  "message": "Invalid OTP. 2 attempt(s) remaining before account lockout.",
  "attemptsRemaining": 2
}
```

**Response (Expired OTP):**
```json
{
  "message": "OTP has expired. Please request a new OTP by logging in again."
}
```

**Response (Lockout):**
```json
{
  "message": "Too many failed attempts. Account locked for 30 seconds.",
  "lockoutSeconds": 30
}
```

---

## 🧪 Testing Steps

### Test U12 - MFA Secure Login

1. **Start Backend and Frontend**
   ```bash
   cd iss-yemen
   npm run dev
   ```

2. **Test Login Flow**
   - Navigate to `/login`
   - Enter valid email and password
   - Click "Sign In"
   - Should redirect to `/verify-otp`
   - Check email (or console in mock mode) for OTP

3. **Verify OTP Flow**
   - Enter 6-digit OTP from email
   - Click "Verify Code"
   - Should redirect to `/dashboard` on success
   - Check that JWT cookie is set

4. **Test Email Verification Required**
   - Try logging in with unverified email
   - Should see "Email not verified" error

### Test U13 - OTP Expiration

1. **Request OTP**
   - Login and receive OTP
   - Note the countdown timer (starts at 60 seconds)

2. **Wait for Expiration**
   - Wait 60+ seconds
   - Try to submit expired OTP
   - Should see "OTP has expired" error
   - Form should be disabled

3. **Backend Expiration Check**
   - Use API directly with expired OTP (after 60 seconds)
   - Should return 400 with expiration message

### Test U14 - Invalid OTP Error

1. **Test Invalid OTP**
   - Login and receive OTP
   - Enter wrong OTP (e.g., "000000")
   - Should see error: "Invalid OTP. 2 attempt(s) remaining..."
   - OTP input should be cleared

2. **Test Multiple Failed Attempts**
   - Enter wrong OTP 3 times
   - After 3rd attempt, should see lockout message
   - Account locked for 30 seconds
   - Lockout countdown timer should appear

3. **Test Lockout Behavior**
   - While locked out, try to submit OTP
   - Should see lockout error
   - Form disabled during lockout
   - After 30 seconds, lockout clears

4. **Test Successful Verification After Failed Attempts**
   - Fail 1-2 times
   - Enter correct OTP
   - Should successfully login
   - Failed attempts counter reset

---

## ✅ Acceptance Criteria Checklist

### U12 - MFA Secure Login
- [x] User cannot log in without OTP verification
- [x] OTP is 6 digits
- [x] OTP is hashed before storage in database
- [x] OTP is sent via email using Nodemailer
- [x] Login flow redirects to OTP verification page
- [x] JWT token only issued after successful OTP verification
- [x] User model includes OTP fields

### U13 - OTP Expiration
- [x] OTP expires exactly 60 seconds after generation
- [x] Expired OTP cannot be used for verification
- [x] Frontend shows countdown timer
- [x] Error message shown when OTP expires
- [x] Form disabled when OTP expires

### U14 - Invalid OTP Error
- [x] Clear error message shown for invalid OTP
- [x] Shows attempts remaining (3, 2, 1)
- [x] User locked out after 3 failed attempts
- [x] Lockout duration is 30 seconds
- [x] Lockout countdown timer displayed
- [x] Clear error messages for all failure scenarios

---

## 📁 Files Modified/Created

### Backend
- `backend/src/models/User.model.js` - Added OTP fields
- `backend/src/controllers/auth.controller.js` - Modified login, added verifyOTP
- `backend/src/routes/auth.routes.js` - Added verify-otp route
- `backend/src/middlewares/validators.js` - Added verifyOtpSchema
- `backend/src/utils/tokens.js` - Added generateOTP and addSeconds

### Frontend
- `frontend/src/pages/VerifyOTP.jsx` - New OTP verification page
- `frontend/src/pages/Login.jsx` - Modified to redirect to verify-otp
- `frontend/src/api/auth.js` - Added verifyOtpApi
- `frontend/src/App.jsx` - Added verify-otp route

---

## 🚀 Deployment Notes

1. **Environment Variables**: No new env variables required
2. **Database Migration**: Existing users will have `null` values for new OTP fields (handled gracefully)
3. **Email Configuration**: Uses existing Nodemailer setup
4. **Backward Compatibility**: Existing verified users can use MFA (required for login)

---

## 📝 Notes

- In development mode, OTP is included in API responses for easier testing
- OTP input field uses monospace font and letter spacing for better readability
- Countdown timers use `useEffect` with cleanup to prevent memory leaks
- All error messages are user-friendly and actionable
- Lockout prevents brute force attacks while maintaining usability

---

**Implementation Complete** ✅
All Sprint 3 backlog items (U12, U13, U14) have been successfully implemented and tested.

