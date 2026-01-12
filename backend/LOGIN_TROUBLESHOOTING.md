# 🔧 Login Troubleshooting Guide

## ✅ Admin Account Created Successfully!

The admin account has been created in your cloud database:
- **Email:** `admin@issyemen.com`
- **Password:** `Admin123!`
- **Role:** `admin`
- **Email Verified:** ✅ Yes

## 🔄 Next Steps

### 1. Restart Backend Server

**IMPORTANT:** You must restart your backend server for the changes to take effect!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### 2. Verify Login Works

Run the test script to verify everything is correct:

```bash
cd backend
npm run test-login
```

You should see:
```
✅ All checks passed! Login should work.
```

### 3. Try Logging In

1. Go to the login page
2. Enter:
   - Email: `admin@issyemen.com`
   - Password: `Admin123!`
3. Click "Sign In"

## 🚨 If Still Getting "Invalid email or password"

### Check 1: Backend Server Status

Make sure your backend server is running:
```bash
# Check if server is running on port 5000
# Look for: "API listening on port 5000"
```

### Check 2: Database Connection

Verify backend is connected to cloud database:
```bash
# Look for in backend logs:
[DB] Connected to ☁️  MongoDB Atlas (Cloud)
```

### Check 3: Test Login Script

Run the test script:
```bash
cd backend
npm run test-login
```

If this fails, the issue is with the database connection or account.

### Check 4: Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Check for any error messages

### Check 5: Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in
4. Look for the `/api/auth/login` request
5. Check:
   - Status code (should be 200 for success)
   - Response body (should contain user object)
   - Request payload (email and password)

### Check 6: Backend Logs

When you try to login, check backend console for:
- Any error messages
- Database query logs
- Authentication logs

## 🔍 Common Issues

### Issue: "Invalid email or password"

**Possible Causes:**
1. Backend not connected to cloud database
2. Admin account doesn't exist
3. Password mismatch
4. Email not verified

**Solution:**
```bash
cd backend
npm run verify-admin
npm run test-login
# Restart server
npm run dev
```

### Issue: "Email not verified"

**Solution:**
```bash
cd backend
npm run verify-admin
# This will auto-verify the email
```

### Issue: Backend can't connect to database

**Solution:**
1. Check `MONGO_URI` in `backend/.env`
2. Should be: `mongodb+srv://...` (cloud connection)
3. Verify MongoDB Atlas network access (IP whitelist)

### Issue: Frontend can't reach backend

**Solution:**
1. Check backend is running on port 5000
2. Check frontend API base URL
3. Check CORS settings in backend

## 📋 Quick Checklist

- [ ] Backend server is running
- [ ] Backend connected to cloud database
- [ ] Admin account exists (run `npm run verify-admin`)
- [ ] Password is correct: `Admin123!`
- [ ] Email is verified
- [ ] Backend server restarted after creating account
- [ ] Browser cache cleared
- [ ] No errors in browser console
- [ ] No errors in backend logs

## 🆘 Still Not Working?

1. **Run verification:**
   ```bash
   cd backend
   npm run verify-admin
   npm run test-login
   ```

2. **Check backend logs** when attempting login

3. **Check browser console** for frontend errors

4. **Verify database connection:**
   - Check `MONGO_URI` in `.env`
   - Run `npm run verify-cloud-connection`

5. **Restart everything:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Restart both

## ✅ Success Indicators

When login works, you should:
- See "Login successful" message (if backend returns it)
- Be redirected to `/admin/dashboard`
- See admin dashboard with sidebar
- No error messages in console
