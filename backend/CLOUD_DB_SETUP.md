# ☁️ Cloud Database Setup Guide

This guide ensures **ALL backend data is linked to the cloud MongoDB database**.

## ✅ Current Status

All backend models and data are automatically connected to the cloud database when `MONGO_URI` is set correctly. The system uses a **single Mongoose connection** that all models share.

### Data Collections Linked to Cloud DB:

1. ✅ **Users** - User accounts, authentication, roles
2. ✅ **Events** - Events, announcements, activities, news
3. ✅ **Payments** - Payment transactions
4. ✅ **PaymentReceipts** - Payment receipt submissions
5. ✅ **Receipts** - Official payment receipts
6. ✅ **HODs** - Heads of Department
7. ✅ **AboutUs** - About Us page content
8. ✅ **EmailConfigs** - Email configuration
9. ✅ **ChatRules** - Chatbot rules and FAQs
10. ✅ **GridFS** - Image and file storage (uses same connection)

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables

Create or update `backend/.env` file:

```env
# MongoDB Cloud Database Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/iss_yemen_club

# Example (replace with your actual credentials):
# MONGO_URI=mongodb+srv://iss_yemen:your-password@cluster0.bsd9msg.mongodb.net/iss_yemen_club
```

**Important:**
- Replace `username` with your MongoDB Atlas username
- Replace `password` with your MongoDB Atlas password
- Replace `cluster.mongodb.net` with your actual cluster URL
- The database name `iss_yemen_club` will be used automatically

### Step 2: Verify MongoDB Atlas Access

1. **Network Access:**
   - Log in to MongoDB Atlas
   - Go to **Network Access**
   - Ensure your IP is whitelisted (or use `0.0.0.0/0` for development)

2. **Database User:**
   - Go to **Database Access**
   - Ensure you have a user with read/write permissions
   - Use that user's credentials in `MONGO_URI`

### Step 3: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
[DB] Attempting to connect to MongoDB (Atlas)...
[DB] Connected to MongoDB
API listening on port 5000
```

### Step 4: Verify Connection

Run the verification script:

```bash
cd backend
node src/scripts/verify-cloud-connection.js
```

This will check:
- ✅ Connection to cloud database
- ✅ All collections are accessible
- ✅ All models are using cloud connection
- ✅ GridFS is connected

## 📊 How It Works

### Single Connection Architecture

All backend data uses **one Mongoose connection** established in `backend/src/startup/db.js`:

```javascript
// server.js calls this on startup
await connectToDatabase(); // Connects to MONGO_URI

// All models automatically use this connection
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
// ... etc
```

### Model Connection

All models use `mongoose.model()`, which automatically uses the default Mongoose connection:

- ✅ `User.model.js` → Uses cloud DB
- ✅ `Event.model.js` → Uses cloud DB
- ✅ `Payment.model.js` → Uses cloud DB
- ✅ `PaymentReceipt.model.js` → Uses cloud DB
- ✅ `Receipt.model.js` → Uses cloud DB
- ✅ `HOD.model.js` → Uses cloud DB
- ✅ `AboutUs.model.js` → Uses cloud DB
- ✅ `EmailConfig.model.js` → Uses cloud DB
- ✅ `ChatRule.model.js` → Uses cloud DB

### GridFS Connection

GridFS uses `mongoose.connection.db`, which is the same cloud connection:

```javascript
// gridfs.js
const db = mongoose.connection.db; // Uses cloud connection
const gridFSBucket = new GridFSBucket(db, { bucketName: 'images' });
```

## 🔍 Verification

### Check Connection Status

**Option 1: Health Check Endpoint**
```bash
curl http://localhost:5000/api/health/db
```

Response:
```json
{
  "state": "connected",
  "readyState": 1
}
```

**Option 2: Backend Logs**
Look for these messages:
```
[DB] Attempting to connect to MongoDB (Atlas)...
[DB] Connected to MongoDB
```

**Option 3: Verification Script**
```bash
cd backend
node src/scripts/verify-cloud-connection.js
```

### Test Data Operations

1. **Create a test event:**
   ```bash
   # Use your API or admin panel
   POST /api/events
   ```

2. **Check MongoDB Atlas:**
   - Log in to MongoDB Atlas
   - Go to **Collections**
   - Check `iss_yemen_club` database
   - Verify new data appears in `events` collection

## 🚨 Troubleshooting

### Issue: "Connection failed"

**Solution:**
1. Check `MONGO_URI` in `.env` file
2. Verify MongoDB Atlas network access (IP whitelist)
3. Verify database user credentials
4. Check internet connection

### Issue: "Data not appearing in cloud DB"

**Solution:**
1. Verify connection logs show "Atlas" not "Local"
2. Check `.env` file has correct `MONGO_URI`
3. Restart backend server after changing `.env`
4. Run verification script

### Issue: "Still using local database"

**Solution:**
1. Ensure `.env` file exists in `backend/` directory
2. Check `MONGO_URI` doesn't contain `localhost` or `127.0.0.1`
3. Verify `MONGO_URI` starts with `mongodb+srv://`
4. Restart backend server

## 📝 Environment Variables

### Required:
- `MONGO_URI` - MongoDB connection string (cloud)

### Optional:
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## 🔐 Security Notes

1. **Never commit `.env` file** to Git
2. **Never share credentials** in code or documentation
3. **Use environment variables** for all sensitive data
4. **Rotate passwords** regularly
5. **Use IP whitelisting** in production (not `0.0.0.0/0`)

## 📚 Related Documentation

- [Database Migration Guide](../DATABASE_MIGRATION_SETUP.md)
- [Data Sync Guide](./DATA_SYNC_GUIDE.md)
- [HOD Cloud Sync Guide](../HOD_CLOUD_SYNC.md)

## ✅ Summary

**All backend data is automatically linked to cloud DB when:**
1. ✅ `MONGO_URI` is set to cloud connection string
2. ✅ Backend server is started
3. ✅ MongoDB Atlas access is configured

**No additional code changes needed** - the system is already designed to use cloud DB! 🎉
