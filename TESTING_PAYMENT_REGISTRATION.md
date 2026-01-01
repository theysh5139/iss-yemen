# Testing Payment Registration & Verification

This guide explains how to test the event registration with payment system and admin payment verification.

## Prerequisites

1. **Backend server running** on port 5000
2. **Frontend server running** on port 5173
3. **MongoDB database** connected
4. **Events seeded** in the database (some with payment requirements)

## Step 1: Seed Events (if not already done)

```bash
cd backend
npm run seed-events
```

This will create sample events, including some that require payment:
- Yemeni Cultural Night 2025 (RM 25.00)
- Eid Al-Fitr Community Celebration (RM 20.00)
- Yemeni Traditional Cooking Class (RM 30.00)

## Step 2: Seed Dummy Registrations with Payment

This script will:
- Create test member accounts (if none exist)
- Register members for events that require payment
- Generate payment receipts with "Pending" status

```bash
cd backend
npm run seed-registrations
```

**What this does:**
- Finds events that require payment
- Finds or creates member users
- Registers 2-4 members per event
- Generates payment receipts automatically
- Sets all receipts to "Pending" status for admin verification

## Step 3: Test as a Member User

### 3.1 Login as Member

1. Go to `http://localhost:5173`
2. Login with a member account (or use one of the test accounts created by the seed script):
   - Email: `ahmed.member@test.com`
   - Password: `Test123!`
   - (Or any other member account)

### 3.2 Register for an Event with Payment

1. Navigate to the homepage
2. Click "Join Events" button
3. Find an event that requires payment (look for events with payment amount shown)
4. Click on the event to open the registration modal
5. You should see:
   - Payment information displayed (e.g., "💰 Payment Required: RM 25.00")
   - A notice about payment verification
   - Button text: "Register & Pay RM 25.00"
6. Click "Register & Pay RM [amount]"
7. After registration:
   - A payment receipt will be generated
   - Receipt number will be displayed
   - You can download or share the receipt
   - Receipt status will be "Pending" (waiting for admin verification)

### 3.3 View Your Receipts

After registering, you can:
- Download the receipt PDF
- Share the receipt via a shareable link
- The receipt will show "Pending" status until admin verifies it

## Step 4: Test as Admin - Verify Payments

### 4.1 Login as Admin

1. Login with an admin account
2. Navigate to Admin Dashboard
3. Click on "Verify Payments" in the sidebar

### 4.2 View Payment Receipts

You should see:
- **Summary Cards:**
  - Pending payments (blue)
  - Verified payments (green)
  - Rejected payments (red)
  - Total payments (light blue)

- **Payment List:**
  - All registrations with payment receipts
  - User information (name, email)
  - Event information (name, date)
  - Receipt number and amount
  - Payment status (Pending/Verified/Rejected)
  - Registration date

### 4.3 Verify a Payment

1. Find a payment with "Pending" status
2. Review the payment details
3. Click "Approve" button
4. Confirm the action
5. The payment status will change to "Verified"
6. The summary cards will update automatically

### 4.4 Reject a Payment (if needed)

1. Find a payment with "Pending" status
2. Click "Reject" button
3. Confirm the action
4. The payment status will change to "Rejected"

## Step 5: Verify User-Admin Link

### 5.1 Check Registered Users for an Event

As an admin:
1. Go to "Events" in the admin dashboard
2. Click on any event
3. You should see:
   - List of registered users
   - Their payment status (if payment required)
   - Receipt numbers
   - Registration dates

### 5.2 Check Payment Details

In "Verify Payments" page:
- Each payment shows:
  - User name and email (clickable link to user profile)
  - Event name and date
  - Receipt number
  - Amount paid
  - Registration timestamp
  - Verification status

## Testing Checklist

- [ ] Events with payment are displayed correctly
- [ ] Member can register for events with payment
- [ ] Payment receipt is generated upon registration
- [ ] Receipt shows correct amount and details
- [ ] Member can download receipt
- [ ] Member can share receipt
- [ ] Admin can see all pending payments
- [ ] Admin can approve payments
- [ ] Admin can reject payments
- [ ] Payment status updates correctly
- [ ] Summary statistics update correctly
- [ ] User information is linked correctly
- [ ] Event information is linked correctly

## Troubleshooting

### No payments showing in admin panel

1. Make sure you've run `npm run seed-registrations`
2. Check that events have `requiresPayment: true` and `paymentAmount > 0`
3. Verify that members have registered for those events
4. Check browser console for errors

### Payment receipt not generated

1. Check that the event has `requiresPayment: true`
2. Verify `paymentAmount` is greater than 0
3. Check backend logs for errors
4. Ensure user is logged in as a member

### Cannot approve/reject payment

1. Verify you're logged in as admin
2. Check that the payment exists in the database
3. Check backend logs for errors
4. Verify the route is correct: `/api/admin/payments/:eventId/:registrationIndex/approve`

## Notes

- All payment receipts start with "Pending" status
- Only admins can verify/reject payments
- Members can see their receipt status but cannot change it
- Receipt numbers are unique and auto-generated
- Payment verification is linked to the admin who verified it

