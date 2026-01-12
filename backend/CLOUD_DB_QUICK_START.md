# ⚡ Cloud Database Quick Start

**Quick guide to link all backend data to cloud MongoDB.**

## 🎯 One-Step Setup

1. **Create `backend/.env` file** (if it doesn't exist):
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/iss_yemen_club
   ```

2. **Replace with your MongoDB Atlas connection string:**
   - Get it from MongoDB Atlas → Connect → Connect your application
   - Format: `mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/iss_yemen_club`

3. **Start backend server:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Verify connection:**
   Look for this in console:
   ```
   [DB] Attempting to connect to MongoDB (Atlas)...
   [DB] Connected to ☁️  MongoDB Atlas (Cloud)
   [DB] Database: iss_yemen_club | Host: cluster.mongodb.net
   ```

## ✅ What's Connected

All these automatically use cloud DB when `MONGO_URI` is set:

- ✅ Users
- ✅ Events
- ✅ Payments
- ✅ Payment Receipts
- ✅ Receipts
- ✅ HODs
- ✅ About Us
- ✅ Email Configs
- ✅ Chat Rules
- ✅ GridFS (images/files)

## 🔍 Verify Everything

Run the verification script:

```bash
cd backend
node src/scripts/verify-cloud-connection.js
```

This checks:
- ✅ Connection to cloud database
- ✅ All collections accessible
- ✅ All models working
- ✅ GridFS connected

## 🚨 Troubleshooting

**"Connection failed"**
- Check `MONGO_URI` in `.env`
- Verify MongoDB Atlas IP whitelist
- Check internet connection

**"Still using local DB"**
- Ensure `MONGO_URI` starts with `mongodb+srv://`
- Restart backend server after changing `.env`

## 📚 Full Documentation

See [CLOUD_DB_SETUP.md](./CLOUD_DB_SETUP.md) for detailed guide.

---

**That's it!** All backend data is now linked to cloud DB! 🎉
