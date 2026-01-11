# Data Synchronization Guide

This guide explains how data synchronization works between the server and the database, and how to ensure they remain aligned.

## Overview

All CRUD operations in the application are designed to immediately persist to the database. The server uses MongoDB (either local or cloud Atlas) as the single source of truth.

## How Data Synchronization Works

### 1. Database Connection

The application connects to MongoDB using the `MONGO_URI` environment variable:

- **Cloud (Atlas)**: `mongodb+srv://username:password@cluster.mongodb.net/database`
- **Local**: `mongodb://localhost:27017/database`

The connection is established in `backend/src/startup/db.js` and automatically handles:
- SSL/TLS for Atlas connections
- Connection retries with exponential backoff
- Connection state monitoring

### 2. CRUD Operations

All controllers use Mongoose methods that immediately persist to the database:

#### Create Operations
```javascript
// Creates and immediately saves to database
const event = await Event.create({ ... });
const user = await User.create({ ... });
const hod = await HOD.create({ ... });
```

#### Update Operations
```javascript
// Finds, updates, and saves to database
const event = await Event.findById(id);
event.title = newTitle;
await event.save(); // Immediately persisted

// Or using findByIdAndUpdate (atomic operation)
await Event.findByIdAndUpdate(id, { title: newTitle });
```

#### Delete Operations
```javascript
// Immediately deletes from database
await Event.findByIdAndDelete(id);
await User.findByIdAndDelete(id);
```

### 3. Real-Time Updates

After database operations, the system broadcasts real-time updates:

```javascript
// After creating/updating/deleting
const { broadcastEventUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
broadcastEventUpdate(event, 'created');
broadcastDataRefresh('events');
```

This ensures:
- Frontend receives immediate updates via WebSocket
- All connected clients see changes instantly
- No need to manually refresh pages

## Verification

### Run Data Sync Verification

To verify that data is properly synchronized:

```bash
cd backend
npm run verify-data-sync
```

This script will:
1. ✅ Check all collections and document counts
2. ✅ Verify data consistency
3. ✅ Check for missing required fields
4. ✅ Identify potential synchronization issues
5. ✅ Provide recommendations

### What Gets Checked

1. **Events, News, Announcements, Activities**
   - Total counts
   - Separate collections (if migrated)
   - Required fields

2. **Users**
   - Total users
   - Admin vs Member counts

3. **HODs**
   - Total HOD profiles
   - Data integrity

4. **Payments & Receipts**
   - Standalone documents
   - Embedded receipts in events
   - Consistency between collections

5. **Chat Rules**
   - Total rules
   - Configuration

6. **About Us**
   - Content availability

7. **Data Consistency**
   - Missing required fields
   - Payment document alignment
   - Collection synchronization

## Ensuring Synchronization

### 1. Always Use Await

All database operations must use `await`:

```javascript
// ✅ Correct
await event.save();
await Event.create({ ... });

// ❌ Wrong (will not wait for database)
event.save();
Event.create({ ... });
```

### 2. Check Database Connection

Verify the server is connected to the correct database:

```bash
# Check backend logs on startup
[DB] Connected to MongoDB
[DB] Attempting to connect to MongoDB (Atlas)...
```

### 3. Verify MONGO_URI

Ensure `.env` has the correct `MONGO_URI`:

```env
# For cloud database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/iss_yemen_club

# For local database
MONGO_URI=mongodb://localhost:27017/iss_yemen_club
```

### 4. Check for Separate Collections

If data was migrated to separate collections (`news`, `announcements`, `activities`), ensure controllers query both:

- Event model (for data in `events` collection)
- Separate collections (for migrated data)

The `getHomepageData` and `getAllAnnouncements` functions handle this automatically.

## Common Issues and Solutions

### Issue: Data not appearing after creation

**Solution:**
1. Check if operation used `await`
2. Verify database connection
3. Check for errors in server logs
4. Run `npm run verify-data-sync` to check data

### Issue: Data in database but not showing on frontend

**Solution:**
1. Check if frontend is querying correct collections
2. Verify `isPublic` field for public data
3. Check for separate collections that need to be queried
4. Clear browser cache and refresh

### Issue: Updates not reflecting immediately

**Solution:**
1. Check if real-time updates are enabled (Socket.io)
2. Verify frontend auto-refresh is working (30-second polling)
3. Check browser console for WebSocket connection errors

### Issue: Payment receipts not syncing

**Solution:**
1. Verify both embedded receipts (in Event) and standalone Receipt documents
2. Run `npm run restore-payment-receipts` to migrate embedded receipts
3. Check Payment and Receipt collections separately

## Best Practices

1. **Always await database operations**
   ```javascript
   await model.save();
   await Model.create({ ... });
   ```

2. **Handle errors properly**
   ```javascript
   try {
     await event.save();
   } catch (err) {
     console.error('Database error:', err);
     // Handle error
   }
   ```

3. **Verify after critical operations**
   ```javascript
   const event = await Event.create({ ... });
   const verified = await Event.findById(event._id);
   if (!verified) {
     throw new Error('Event not found after creation');
   }
   ```

4. **Use transactions for related operations**
   ```javascript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     await Event.create([...], { session });
     await Payment.create([...], { session });
     await session.commitTransaction();
   } catch (err) {
     await session.abortTransaction();
     throw err;
   }
   ```

5. **Monitor database connection**
   - Check logs for connection status
   - Set up connection event listeners
   - Handle reconnection automatically

## Monitoring

### Check Server Logs

Look for:
- `[DB] Connected to MongoDB` - Connection successful
- `[DB] MongoDB error:` - Connection issues
- `[Socket] Real-time server initialized` - Real-time updates active

### Check Database Directly

Use MongoDB Compass or Atlas UI to:
- View collections and documents
- Verify data exists
- Check document structure
- Monitor collection sizes

### Run Verification Script

Regularly run:
```bash
npm run verify-data-sync
```

This helps identify:
- Missing data
- Inconsistent counts
- Structural issues
- Synchronization problems

## Summary

✅ **All CRUD operations immediately persist to database**  
✅ **Real-time updates broadcast changes to frontend**  
✅ **Auto-refresh ensures UI stays in sync**  
✅ **Verification script helps identify issues**  
✅ **Controllers handle both Event model and separate collections**

The system is designed to keep the database and server synchronized automatically. If you notice any discrepancies, run the verification script and check the recommendations.

