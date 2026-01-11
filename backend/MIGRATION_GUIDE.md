# Migration Guide: Import Data to Cloud MongoDB

This guide explains how to migrate all your local data (including payment receipts and uploaded files) to your cloud MongoDB database.

## What Gets Migrated

1. **Payment/Receipt Data**: Extracts payment receipt data from `Event.registrations` and creates separate `Payment` and `Receipt` documents
2. **Uploaded Files**: Migrates files from `uploads/` folder to MongoDB GridFS (if enabled)
   - Images (`uploads/images/`)
   - Receipts (`uploads/receipts/`)
   - QR Codes (`uploads/qr/`)

## Prerequisites

1. **MongoDB Connection**: Ensure your `MONGO_URI` in `.env` points to your cloud MongoDB
2. **GridFS (Optional)**: If you want to migrate files to GridFS, install the mongodb package:
   ```bash
   cd backend
   npm install mongodb
   ```

## Step-by-Step Migration

### 1. Configure Environment

Make sure your `backend/.env` has the correct MongoDB connection string:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/iss_yemen_club

# Optional: Enable GridFS for file storage
USE_GRIDFS=true
```

### 2. Run Migration Script

```bash
cd backend
npm run migrate-to-cloud
```

### 3. What Happens During Migration

The script will:

1. **Connect to MongoDB**: Connects to your cloud database
2. **Migrate Payment/Receipt Data**:
   - Scans all events with payment receipts in `registrations`
   - Creates `Payment` documents in the `payments` collection
   - Creates `Receipt` documents in the `receipts` collection
   - Links them together with proper references
3. **Migrate Files (if GridFS enabled)**:
   - Uploads all images to GridFS
   - Uploads all receipt files to GridFS
   - Uploads all QR codes to GridFS
   - Creates `images.files` and `images.chunks` collections

### 4. Verify Migration

After migration, check your MongoDB Atlas:

1. **Collections Created/Updated**:
   - `payments` - Should have payment records
   - `receipts` - Should have receipt records
   - `images.files` & `images.chunks` - If GridFS enabled

2. **Check Counts**:
   ```javascript
   // In MongoDB shell or Compass
   db.payments.countDocuments()
   db.receipts.countDocuments()
   db.getCollection('images.files').countDocuments()
   ```

## Migration Output Example

```
============================================================
MIGRATION TO CLOUD MONGODB
============================================================
MongoDB URI: mongodb+srv://****@cluster.mongodb.net/iss_yemen_club
GridFS Enabled: true
============================================================
[DB] Connected to MongoDB

[FILE MIGRATION] Starting file migration to GridFS...
[FILE MIGRATION] Found 1 image files to migrate
  ✓ Migrated image: 1767797126555-3j04h.png → GridFS ID: 507f1f77bcf86cd799439011
[FILE MIGRATION] Found 19 receipt files to migrate
  ✓ Migrated receipt: 1767324619211-x693z.jpeg → GridFS ID: ...
  ...
[FILE MIGRATION] Completed: 1 images, 19 receipts, 5 QR codes

[PAYMENT MIGRATION] Starting payment/receipt data migration...
[PAYMENT MIGRATION] Found 5 events with payment receipts
  ✓ Created Payment & Receipt for John Doe - Event: "Annual Dinner" - Amount: RM 50.00
  ...
[PAYMENT MIGRATION] Completed:
  - Payments created: 12
  - Receipts created: 12
  - Skipped: 0
  - Errors: 0

============================================================
MIGRATION SUMMARY
============================================================
Files Migrated to GridFS:
  - Images: 1
  - Receipts: 19
  - QR Codes: 5

Payment/Receipt Data:
  - Payments created: 12
  - Receipts created: 12
  - Skipped: 0
  - Errors: 0
============================================================

✅ Migration completed successfully!
```

## Troubleshooting

### Error: "GridFSBucket not available"

**Solution**: Install the mongodb package:
```bash
npm install mongodb
```

### Error: "MongoDB connection not established"

**Solution**: 
1. Check your `MONGO_URI` in `.env`
2. Ensure MongoDB is accessible (network access, IP whitelist)
3. Verify connection string format

### Error: "Payment already exists"

**Solution**: This is normal - the script skips existing payments to avoid duplicates. If you want to re-migrate, you may need to delete existing Payment/Receipt documents first.

### Files Not Migrating

**Possible Causes**:
1. GridFS not enabled (`USE_GRIDFS=false`)
2. Files don't exist in `uploads/` folders
3. File permissions issue

**Solution**: 
- Check if `USE_GRIDFS=true` in `.env`
- Verify files exist in `backend/src/uploads/` folders
- Check file permissions

## After Migration

### Files in GridFS

If you migrated files to GridFS, they're now accessible via:
- URL format: `/api/images/gridfs/{fileId}`
- Old filesystem URLs will still work for files not migrated

### Payment/Receipt Data

- Payment data is now in the `payments` collection
- Receipt data is now in the `receipts` collection
- Original embedded data in `Event.registrations` remains (for backward compatibility)

## Re-running Migration

The migration script is **idempotent** - it's safe to run multiple times:
- Skips existing Payment/Receipt documents
- Only migrates files that haven't been migrated (based on filename)

## Manual Cleanup (Optional)

After verifying migration, you can optionally:
1. **Keep filesystem files**: Safe to keep for backup
2. **Delete filesystem files**: Only if GridFS migration was 100% successful
3. **Update Event references**: If you want to update `imageUrl` and `qrCodeUrl` to point to GridFS URLs

## Need Help?

If migration fails:
1. Check the error messages in the console
2. Verify MongoDB connection
3. Ensure all required packages are installed
4. Check file permissions


