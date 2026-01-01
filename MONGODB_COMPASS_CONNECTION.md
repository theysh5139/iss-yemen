# MongoDB Compass Connection Guide

This guide will help you connect to your MongoDB database using MongoDB Compass.

## Default Connection String

Based on your project configuration, the default MongoDB connection string is:

```
mongodb://localhost:27017/iss_yemen_club
```

## Step-by-Step Connection Instructions

### Step 1: Install MongoDB Compass (if not already installed)

1. Download MongoDB Compass from: https://www.mongodb.com/try/download/compass
2. Install it following the installation wizard
3. Launch MongoDB Compass

### Step 2: Check Your MongoDB Connection String

Your connection string depends on your setup:

#### Option A: Local MongoDB (Default)
If you're running MongoDB locally:
```
mongodb://localhost:27017/iss_yemen_club
```

#### Option B: MongoDB Atlas (Cloud)
If you're using MongoDB Atlas, your connection string will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/iss_yemen_club?retryWrites=true&w=majority
```

#### Option C: Custom MongoDB Server
If you have a custom MongoDB server:
```
mongodb://<host>:<port>/iss_yemen_club
```

### Step 3: Connect Using MongoDB Compass

1. **Open MongoDB Compass**
   - Launch the application

2. **Enter Connection String**
   - In the connection string field, paste your MongoDB URI
   - For local MongoDB: `mongodb://localhost:27017/iss_yemen_club`
   - Click "Connect"

3. **If Authentication is Required**
   - If your MongoDB requires authentication:
     - Click "Fill in connection fields individually"
     - Enter:
       - **Host:** `localhost`
       - **Port:** `27017`
       - **Authentication:** Username/Password (if required)
       - **Authentication Database:** `admin` (or your auth DB)
       - **Default Database:** `iss_yemen_club`

4. **Connect**
   - Click the "Connect" button
   - You should now see your database in the left sidebar

### Step 4: View Your Database

Once connected, you should see:
- **Database Name:** `iss_yemen_club`
- **Collections:**
  - `users` - User accounts (admin, member, visitor)
  - `events` - Events and registrations
  - `hods` - Head of Department profiles
  - `chatrules` - Chatbot rules
  - `aboutus` - About Us content
  - `emailconfigs` - Email configuration

## Finding Your Actual Connection String

### Check Your .env File

1. Navigate to: `backend/.env`
2. Look for the `MONGO_URI` variable
3. Copy the connection string value

**Example .env file:**
```env
MONGO_URI=mongodb://localhost:27017/iss_yemen_club
```

### Check Backend Logs

When you start your backend server, it will show the connection status:
```
[DB] Connected to MongoDB
```

This confirms your MongoDB is running and accessible.

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solutions:**
1. **Check if MongoDB is running:**
   ```bash
   # Windows (check services)
   services.msc
   # Look for "MongoDB" service and ensure it's running
   ```

2. **Start MongoDB service:**
   ```bash
   # Windows PowerShell (as Administrator)
   net start MongoDB
   ```

3. **Verify MongoDB is listening on port 27017:**
   ```bash
   netstat -ano | findstr :27017
   ```

4. **Check firewall settings:**
   - Ensure port 27017 is not blocked by Windows Firewall

### Issue: "Authentication failed"

**Solutions:**
1. If you set up authentication, make sure you're using the correct username and password
2. Check your MongoDB configuration file for authentication settings
3. For local development, you might want to disable authentication temporarily

### Issue: "Database not found"

**Solutions:**
1. The database will be created automatically when you first insert data
2. Make sure your backend has connected at least once
3. Try running: `npm run seed-events` to create some initial data

## Quick Connection String Reference

### Local MongoDB (No Authentication)
```
mongodb://localhost:27017/iss_yemen_club
```

### Local MongoDB (With Authentication)
```
mongodb://username:password@localhost:27017/iss_yemen_club?authSource=admin
```

### MongoDB Atlas (Cloud)
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/iss_yemen_club?retryWrites=true&w=majority
```

## Viewing Collections in Compass

Once connected:

1. **Click on `iss_yemen_club` database** in the left sidebar
2. **Browse Collections:**
   - Click on any collection name (e.g., `users`, `events`)
   - View documents in the collection
   - Use filters and search to find specific documents

3. **Useful Features:**
   - **Documents Tab:** View all documents
   - **Schema Tab:** See the structure of your documents
   - **Indexes Tab:** View database indexes
   - **Validation Tab:** See validation rules

## Testing the Connection

After connecting, you can verify by:

1. **Check if collections exist:**
   - Look for `users`, `events`, `chatrules`, etc.

2. **View sample documents:**
   - Click on a collection
   - You should see documents if data exists

3. **Run a query:**
   - Use the filter bar to query documents
   - Example: `{ "role": "admin" }` to find admin users

## Need Help?

If you're still having trouble:
1. Check MongoDB Compass documentation: https://docs.mongodb.com/compass/
2. Verify your MongoDB service is running
3. Check your connection string matches your actual MongoDB setup
4. Review your backend logs for connection errors

