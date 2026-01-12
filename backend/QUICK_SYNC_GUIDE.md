# ⚡ Quick Cloud DB Reconnect & Sync Guide

## 🚀 One-Command Sync

```bash
cd backend
npm run sync-cloud-db
```

This verifies:
- ✅ Connection to cloud database
- ✅ All collections accessible
- ✅ All models connected
- ✅ Data counts

## 🔧 Fix Connection Issues

If database name is missing or incorrect:

```bash
cd backend
npm run fix-db-connection
```

This will:
- ✅ Check connection string format
- ✅ Add database name if missing
- ✅ Update `.env` file automatically

## 📋 Complete Reconnect Steps

### 1. Fix Connection String (if needed)
```bash
npm run fix-db-connection
```

### 2. Verify Synchronization
```bash
npm run sync-cloud-db
```

### 3. Restart Backend Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## ✅ What's Synchronized

All backend data automatically syncs to cloud:
- Users, Events, Payments, Receipts
- HODs, About Us, Email Config, Chat Rules
- GridFS (images/files)
- News, Announcements, Activities

## 🎯 Success Indicators

When synchronized, you'll see:
```
✅ All data is synchronized with MongoDB Atlas (Cloud)
✅ All models are connected to cloud database
✅ All collections are accessible
```

## 📚 More Info

- Full guide: `CLOUD_DB_RECONNECT.md`
- Setup guide: `CLOUD_DB_SETUP.md`
- Quick start: `CLOUD_DB_QUICK_START.md`
