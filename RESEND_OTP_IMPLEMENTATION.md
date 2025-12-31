# Resend OTP Feature Implementation

## Overview

This document describes the implementation of the "Resend OTP" feature and removal of Dev Mode OTP display for enhanced security in the ISS Yemen WebApp MFA flow.

---

## ✅ Changes Implemented

### 1. **Backend - Resend OTP Endpoint**

#### New Controller Function (`backend/src/controllers/auth.controller.js`)
- Added `resendOTP()` function with:
  - **Email validation**: Checks if user exists (privacy-safe)
  - **Lockout check**: Prevents resend during account lockout
  - **Cooldown mechanism**: 30-second cooldown to prevent spam
    - If OTP expires in more than 30 seconds, enforces cooldown
    - Calculates remaining cooldown time dynamically
  - **New OTP generation**: Generates fresh 6-digit OTP
  - **Reset counters**: Resets failed attempts and clears lockout on resend
  - **Email sending**: Sends OTP via email using existing Nodemailer setup
  - **Development logging**: Logs OTP to console in dev mode (not in response)

#### Validation Schema (`backend/src/middlewares/validators.js`)
- Added `resendOtpSchema`:
  ```javascript
  {
    email: Joi.string().email().required()
  }
  ```

#### Route (`backend/src/routes/auth.routes.js`)
- Added `POST /api/auth/resend-otp` route with validation middleware

#### Security Improvements
- **Removed Dev Mode OTP from API responses**: OTP is never included in JSON responses
- **Console logging only**: In development, OTP is logged to server console for debugging
- **Email-only delivery**: OTP is sent exclusively via email

---

### 2. **Frontend - Resend OTP Button**

#### VerifyOTP Page Updates (`frontend/src/pages/VerifyOTP.jsx`)

**New State Variables:**
- `resending`: Loading state for resend operation
- `success`: Success message display
- `resendCooldown`: Countdown timer for resend button (starts at 30 seconds)

**New Functionality:**
- `handleResendOtp()`: 
  - Calls `resendOtpApi()` with user email
  - Shows success/error messages
  - Sets 30-second cooldown on successful resend
  - Resets OTP expiration timer to 60 seconds
  - Clears current OTP input
  - Handles backend cooldown and lockout responses

**Resend Button:**
- Disabled during cooldown period
- Shows countdown: "Resend code in 25s"
- Shows "Sending..." while processing
- Shows "Resend code" when enabled
- Styled consistently with app design

**Removed Features:**
- ❌ Removed Dev Mode OTP display from UI
- ❌ Removed `devOtp` from Login page state passing

#### API Client (`frontend/src/api/auth.js`)
- Added `resendOtpApi(payload)` function

#### Login Page (`frontend/src/pages/Login.jsx`)
- Removed `devOtp` from navigation state (no longer needed)

---

## 🔐 Security Enhancements

### Before:
- OTP included in API responses in non-production mode
- OTP displayed on screen in "Dev Mode"
- Potential OTP leakage in network responses

### After:
- ✅ OTP **never** included in API responses
- ✅ OTP **never** displayed on screen
- ✅ OTP sent **only** via email
- ✅ Development: OTP logged to server console only
- ✅ Production: OTP completely hidden from client-side

---

## 📋 API Design

### POST /api/auth/resend-otp

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "A new OTP has been sent to your email.",
  "email": "user@example.com"
}
```

**Response (Cooldown):**
```json
{
  "message": "Please wait 15 seconds before requesting a new OTP.",
  "cooldownSeconds": 15
}
```

**Response (Lockout):**
```json
{
  "message": "Account temporarily locked. Please try again in 30 seconds.",
  "lockoutSeconds": 30
}
```

**Response (User Not Found - Privacy Safe):**
```json
{
  "message": "If an account exists, a new OTP has been sent to your email."
}
```

---

## 🎯 User Flow

### Resend OTP Flow:

1. User on `/verify-otp` page
2. User clicks "Resend code" button
3. If cooldown active → Button disabled, shows countdown
4. If cooldown expired → Button enabled
5. User clicks "Resend code"
6. Frontend sends `POST /api/auth/resend-otp` with email
7. Backend validates:
   - User exists
   - Not locked out
   - Cooldown period passed
8. Backend generates new OTP
9. Backend sends OTP via email
10. Frontend shows success message
11. Frontend resets countdown timers (OTP expiration + resend cooldown)
12. User receives new OTP in email

---

## 🧪 Testing Steps

### Test Resend OTP Feature:

1. **Start Servers**
   ```bash
   cd iss-yemen
   npm run dev
   ```

2. **Login and Receive OTP**
   - Navigate to `/login`
   - Enter credentials
   - Redirected to `/verify-otp`
   - Check email/console for OTP

3. **Test Resend Button**
   - Click "Resend code" immediately
   - Button should be enabled
   - Should see success message
   - Should receive new OTP in email
   - Button should show countdown: "Resend code in 30s"

4. **Test Cooldown**
   - Try clicking "Resend code" again within 30 seconds
   - Button should be disabled
   - Should show countdown timer
   - After 30 seconds, button becomes enabled

5. **Test Old OTP Invalid**
   - Receive initial OTP (e.g., "123456")
   - Click "Resend code"
   - Receive new OTP (e.g., "789012")
   - Try using old OTP "123456"
   - Should fail with "Invalid OTP" error
   - Use new OTP "789012"
   - Should succeed

6. **Test Cooldown from Backend**
   - Send resend request via API
   - Immediately send another resend request
   - Should receive 429 error with cooldown message

7. **Verify No OTP in Responses**
   - Check network tab in browser DevTools
   - Verify no `devOtp` field in API responses
   - Verify OTP not visible in UI

8. **Verify Production Safety**
   - Set `NODE_ENV=production`
   - OTP should only be in email, never in console logs or responses

---

## ✅ Acceptance Criteria

- [x] Resend OTP endpoint created (`POST /api/auth/resend-otp`)
- [x] 30-second cooldown implemented (prevents spam)
- [x] New OTP invalidates old OTP
- [x] Resend button with countdown timer on frontend
- [x] Success/error messages displayed
- [x] OTP never included in API responses
- [x] OTP never displayed on screen
- [x] OTP sent only via email
- [x] Development: OTP logged to server console only
- [x] Production: Complete OTP security
- [x] Cooldown respects backend constraints
- [x] Lockout properly handled

---

## 📁 Files Modified

### Backend:
- `backend/src/controllers/auth.controller.js`
  - Added `resendOTP()` function
  - Removed `devOtp` from login response
  - Changed error handling to console logging in dev mode

- `backend/src/routes/auth.routes.js`
  - Added `/resend-otp` route

- `backend/src/middlewares/validators.js`
  - Added `resendOtpSchema`

### Frontend:
- `frontend/src/pages/VerifyOTP.jsx`
  - Added resend button with countdown
  - Added `handleResendOtp()` function
  - Removed Dev Mode OTP display
  - Added success message display
  - Added resend cooldown timer

- `frontend/src/api/auth.js`
  - Added `resendOtpApi()` function

- `frontend/src/pages/Login.jsx`
  - Removed `devOtp` from navigation state

---

## 🔄 Updated MFA Flow

### Complete Login Flow with Resend:

1. **Login** → User enters email/password
2. **OTP Generation** → Backend generates 6-digit OTP
3. **Email Sent** → OTP sent via email (no UI display, no API response)
4. **OTP Verification Page** → User redirected to `/verify-otp`
5. **OTP Entry** → User enters 6-digit code from email
6. **Verification** → Backend validates OTP
7. **Success** → JWT issued, user redirected to dashboard

### Resend OTP Flow:

1. **Resend Request** → User clicks "Resend code"
2. **Cooldown Check** → Frontend checks 30s cooldown
3. **API Call** → `POST /api/auth/resend-otp`
4. **Backend Validation** → Cooldown, lockout, user checks
5. **New OTP** → Fresh 6-digit OTP generated
6. **Email Sent** → New OTP sent via email
7. **UI Update** → Success message, cooldown timer starts
8. **Old OTP Invalid** → Previous OTP no longer works

---

## 🔒 Security Best Practices Applied

1. **No OTP Leakage**: OTP never in HTTP responses or UI
2. **Rate Limiting**: 30-second cooldown prevents abuse
3. **Privacy Protection**: Same message for existing/non-existing users
4. **Lockout Respect**: Resend blocked during account lockout
5. **OTP Invalidation**: Old OTP invalidated on resend
6. **Secure Storage**: OTP always hashed in database
7. **Email-Only Delivery**: Single delivery channel (email)

---

**Implementation Complete** ✅

All requested features have been implemented and tested. The MFA flow is now more secure and user-friendly with the resend OTP capability.


