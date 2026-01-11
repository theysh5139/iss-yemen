# Complete Data Restore Guide

This guide covers multiple methods to restore all your data (including news and announcements) to cloud MongoDB.

## Method 1: Restore from BSON Backup Files (Recommended)

You have BSON backup files in `backend/db_backup/iss_yemen_club/`. This is the **fastest and most complete** way to restore all data.

### Prerequisites

1. **Install MongoDB Database Tools** (if not already installed):
   - Download from: https://www.mongodb.com/try/download/database-tools
   - Or use: `brew install mongodb-database-tools` (Mac)
   - Or: `choco install mongodb-database-tools` (Windows)

2. **Get your MongoDB connection string** from MongoDB Atlas:
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/iss_yemen_club`

### Restore Steps

1. **Open terminal/command prompt** in the `backend` directory

2. **Run mongorestore command**:
   ```bash
   mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net" --db=iss_yemen_club db_backup/iss_yemen_club/
   ```

   **Windows PowerShell** (if you have special characters in password):
   ```powershell
   mongorestore --uri='mongodb+srv://username:password@cluster.mongodb.net' --db=iss_yemen_club db_backup/iss_yemen_club/
   ```

3. **Verify restore**:
   - Check MongoDB Atlas collections
   - You should see all collections populated:
     - `events` (includes news and announcements)
     - `users`
     - `payments`
     - `receipts`
     - `aboutus`
     - `chatrules`
     - `hods`
     - etc.

### What Gets Restored

✅ All Events (including news and announcements)  
✅ All Users  
✅ All Payments  
✅ All Receipts  
✅ About Us content  
✅ Chat Rules  
✅ HODs  
✅ Email Configs  
✅ All other collections  

## Method 2: Use Restore Script (For Missing Data)

If you've already restored from BSON but some data is missing, or if you want to migrate from a local database:

### Setup

1. **Configure environment** in `backend/.env`:
   ```env
   # Cloud MongoDB (where to restore TO)
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/iss_yemen_club
   
   # Optional: Local MongoDB (where to restore FROM)
   LOCAL_MONGO_URI=mongodb://localhost:27017/iss_yemen_club
   
   # Optional: Enable GridFS for file storage
   USE_GRIDFS=true
   ```

2. **Run restore script**:
   ```bash
   cd backend
   npm run restore-all-data
   ```

### What the Script Does

1. **Checks for BSON backup files** and provides mongorestore instructions
2. **Restores from local database** (if LOCAL_MONGO_URI is different from MONGO_URI)
   - Migrates all events (including news and announcements)
   - Migrates all users
3. **Migrates payment/receipt data** from Event.registrations to separate collections
4. **Migrates uploaded files** to GridFS (if enabled)
5. **Verifies** all data is present

### Script Output Example

```
======================================================================
COMPREHENSIVE DATA RESTORE TO CLOUD MONGODB
======================================================================
Cloud MongoDB URI: mongodb+srv://****@cluster.mongodb.net/iss_yemen_club
GridFS Enabled: true
======================================================================

[BACKUP FILES] Found backup files in db_backup/iss_yemen_club/
[INFO] To restore from BSON files, use mongorestore command:
  mongorestore --uri="YOUR_MONGO_URI" --db=iss_yemen_club db_backup/iss_yemen_club/
[INFO] Continuing with other restore methods...

[DB] Connected to cloud MongoDB

[VERIFICATION] Verifying data in cloud database...
[VERIFICATION] Current cloud database counts:
  - Events: 5
  - News: 0  ← Missing!
  - Announcements: 0  ← Missing!
  - Activities: 0
  - Users: 4
  - Payments: 0
  - Receipts: 0

[LOCAL DB RESTORE] Attempting to restore from local database...
[LOCAL DB] Found 15 events and 4 users in local DB
[LOCAL DB] Breakdown: 5 events, 3 news, 2 announcements
  ✓ Restored News: "Latest Club Updates"
  ✓ Restored News: "New Member Welcome"
  ✓ Restored Announcement: "Meeting Schedule"
  ✓ Restored Announcement: "Event Registration Open"
  ✓ Restored Event: "Annual Dinner"

[PAYMENT MIGRATION] Migrating payment/receipt data...
[PAYMENT MIGRATION] Found 3 events with payment receipts
  ✓ Created Payment & Receipt for John Doe - Event: "Annual Dinner" - Amount: RM 50.00
  ...

[FILE MIGRATION] Migrating files to GridFS...
  ✓ Migrated image: 1767797126555-3j04h.png → GridFS ID: 507f1f77bcf86cd799439011
  ...

======================================================================
RESTORE SUMMARY
======================================================================
Data Restored:
  - Events: 5
  - News: 3
  - Announcements: 2
  - Users: 0 (already existed)
  - Payments: 12
  - Receipts: 12

Files Migrated:
  - Images: 1
  - Receipts: 19
  - QR Codes: 5

Final Database Counts:
  - Events: 5 (was 5)
  - News: 3 (was 0)  ← Restored!
  - Announcements: 2 (was 0)  ← Restored!
  - Users: 4 (was 4)
  - Payments: 12 (was 0)  ← Restored!
  - Receipts: 12 (was 0)  ← Restored!
======================================================================

✅ Restore completed!
```

## Method 3: Manual Verification & Fix

After restore, verify all data types:

### Check News Items

News items are stored as:
- `type: 'event'`
- `category: 'News'`

Query in MongoDB:
```javascript
db.events.find({ type: 'event', category: 'News' })
```

### Check Announcements

Announcements are stored as:
- `type: 'announcement'`

Query in MongoDB:
```javascript
db.events.find({ type: 'announcement' })
```

### Check All Event Types

```javascript
// All events (excluding news)
db.events.find({ type: 'event', category: { $ne: 'News' } })

// All news
db.events.find({ type: 'event', category: 'News' })

// All announcements
db.events.find({ type: 'announcement' })

// All activities
db.events.find({ type: 'activity' })
```

## Troubleshooting

### "mongorestore: command not found"

**Solution**: Install MongoDB Database Tools:
- Windows: Download from MongoDB website
- Mac: `brew install mongodb-database-tools`
- Linux: `apt-get install mongodb-database-tools` or `yum install mongodb-database-tools`

### "Authentication failed"

**Solution**: 
1. Check your MongoDB Atlas username and password
2. Ensure your IP is whitelisted in MongoDB Atlas Network Access
3. URL-encode special characters in password

### "No data restored"

**Solution**:
1. Verify BSON files exist in `db_backup/iss_yemen_club/`
2. Check file permissions
3. Ensure database name matches (`iss_yemen_club`)
4. Check MongoDB connection string format

### "News/Announcements still missing after restore"

**Solution**:
1. Check if they exist in local database
2. Run the restore script: `npm run restore-all-data`
3. Manually verify in MongoDB Atlas that events with `category: 'News'` or `type: 'announcement'` exist

### Files Not Migrating

**Solution**:
1. Set `USE_GRIDFS=true` in `.env`
2. Install mongodb package: `npm install mongodb`
3. Verify files exist in `backend/src/uploads/` folders

## After Restore

### Verify in MongoDB Atlas

1. Go to your MongoDB Atlas cluster
2. Click "Browse Collections"
3. Check `events` collection:
   - Filter by `type: 'event'` and `category: 'News'` for news
   - Filter by `type: 'announcement'` for announcements
4. Check other collections for completeness

### Verify in Application

1. **Homepage**: Check if news and announcements appear
2. **Admin Dashboard**: Verify counts match
3. **Admin News Page**: Check if news items are listed
4. **Events Page**: Verify events are displayed

## Best Practice

**Recommended Approach**:
1. **First**: Use `mongorestore` with BSON files (fastest, most complete)
2. **Then**: Run `npm run restore-all-data` to migrate payment/receipt data and files
3. **Finally**: Verify all data in MongoDB Atlas

This ensures:
- ✅ All data restored (including news and announcements)
- ✅ Payment/receipt data properly structured
- ✅ Files migrated to GridFS (if enabled)
- ✅ Everything verified and working

## Need Help?

If restore fails:
1. Check error messages in console
2. Verify MongoDB connection string
3. Ensure all required packages are installed
4. Check file permissions
5. Verify BSON files are not corrupted


