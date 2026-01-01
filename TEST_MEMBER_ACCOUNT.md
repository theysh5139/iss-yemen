# Test Member Account (Bypasses OTP/TAC)

## Overview

A special test member account has been configured to bypass OTP (One-Time Password) / TAC (Two-Factor Authentication) verification during login. This is **for testing purposes only** and should **NOT** be used in production.

## Default Test Account Credentials

- **Email**: `testmember@test.com`
- **Password**: `TestMember123!`
- **Name**: `Test Member`
- **Role**: `member`

## Customization

You can customize the test account by setting environment variables:

```bash
# In your .env file
TEST_MEMBER_EMAIL=your-test-email@test.com
TEST_MEMBER_PASSWORD=YourTestPassword123!
TEST_MEMBER_NAME=Your Test Name
```

## Creating the Test Account

Run the following command to create the test member account:

```bash
npm run create-test-member
```

Or directly:

```bash
node src/scripts/create-test-member.js
```

## How It Works

The login controller checks if the email matches the test member email (configured via `TEST_MEMBER_EMAIL` environment variable or defaults to `testmember@test.com`). If it matches and the user role is `member`, the OTP verification step is skipped, allowing direct login.

**Code Location**: `backend/src/controllers/auth.controller.js` (lines 108-118)

## Security Note

⚠️ **IMPORTANT**: 
- This bypass is **ONLY for testing purposes**
- Do **NOT** use this account in production
- The test account email is configurable via environment variables
- Consider removing or disabling this feature before deploying to production

## Usage

1. Create the test account using the script above
2. Login with the test credentials
3. You will be logged in directly without needing to enter an OTP code
4. The login response will include: `"Login successful (Test account - OTP bypassed)"`

## Example Login Flow

**Normal Member Account:**
1. Enter email and password
2. Receive OTP via email
3. Enter OTP code
4. Login successful

**Test Member Account:**
1. Enter email (`testmember@test.com`) and password
2. Login successful (no OTP required)


