# 🚀 Database Migration Guide: Local to Centralized

This project has transitioned from using individual local databases to a **centralized MongoDB Atlas cloud database**. This ensures all developers work with the same data set and eliminates "it works on my machine" data issues.

---

## 🛠️ Prerequisites
To manage the database, you must have the **MongoDB Database Tools** installed on your machine.

1.  **Download:** [MongoDB Database Tools MSI](https://www.mongodb.com/try/download/database-tools).
2.  **Install:** Run the installer.
3.  **Path Configuration (Windows):**
    * Find the `bin` folder (usually `C:\Program Files\MongoDB\Tools\100\bin`).
    * Add this path to your **System Environment Variables** under "Path" so you can use `mongodump` and `mongorestore` anywhere.

---

## 👥 Guide for Developers: Connecting to the Shared Cloud Database

All developers must connect to the **centralized MongoDB Atlas database** to ensure consistent data across the team.

---

### 1️⃣ Request Database Access
Ask the project administrator to:
- Create a MongoDB Atlas database user for you, or (Request if want more privacy/Secure)
- Share the **username** and **password** securely (We use this for now)

You **must not** commit database credentials to GitHub.

---

### 2️⃣ Whitelist Your IP Address
1. Log in to **MongoDB Atlas**
2. Go to **Network Access**
3. Click **Add IP Address**
4. Choose one:
   - **Allow Access From Anywhere (0.0.0.0/0)** *(development only)*  
   - Or add your **current IP address**
5. Save changes

> ⏳ IP changes may take 1–2 minutes to apply.

---

### 3️⃣ Get the Connection String
1. In MongoDB Atlas, click **Connect**
2. Select **Connect your application**
3. Choose:
   - Driver: **Node.js**
   - Version: **4.0 or later**
4. Copy the connection string

```env
mongodb+srv://iss_yemen:<PASSWORD>@cluster0.bsd9msg.mongodb.net/iss_yemen_club
```
---

## 📤 How to Migrate Local Data to Cloud
If you have data on your local machine that needs to be moved to the shared cloud database, follow these steps:

### 1. Export from Local
Open your terminal and run:
```bash
mongodump --uri="mongodb://localhost:27017/iss_yemen_club" --out="./db_backup"
```

Try running this exact command in your PowerShell:(if cannot find path)
Check your downloaded Mongodb Tools path
```
& "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe" --uri="mongodb://localhost:27017/iss_yemen_club" --out="./db_backup"
```

### 2. Import to Cloud Cluster
Replace <PASSWORD> with your Atlas database user password:
```bash
mongorestore --uri="mongodb+srv://iss_yemen:<PASSWORD>@cluster0.bsd9msg.mongodb.net/" ./db_backup
```

### 3. Handle _id Conflicts
MongoDB will reject documents with existing _ids

   If you want to force new IDs, you can:

   1. Restore into a temporary database
   2. Export to JSON (mongoexport)
   3. Remove _id fields
   4. Import to cloud using mongoimport

Example to remove _id:
```bash 
jq 'del(._id)' backup.json > new_backup.json
mongoimport --uri="..." --db iss_yemen_club --collection users --file new_backup.json
```
---

## ⚙️ Project Configuration
All developers must update their local .env files to connect to the shared instance.

1. Open your .env file.
2. Update the MONGO_URI variable:

Change this:
```
MONGO_URI=mongodb://localhost:27017/iss_yemen_club
```
To this:
```
MONGO_URI=mongodb+srv://iss_yemen:<PASSWORD>@cluster0.bsd9msg.mongodb.net/iss_yemen_club
```

## ☁️ Setting Up MongoDB Atlas (For Admins)
If you need to manage access or the cluster:

1. Network Access: Ensure your IP is whitelisted under Network Access > Add IP Address.

2. Database Access: Create users under Database Access. Use the role "Read and Write to any database".

3. Connection: Use the "Connect" button in Atlas to generate new connection strings for different drivers.

## ⚠️ Important Rules
1. Shared Data: Deleting a record or collection affects all developers. Use caution when testing destructive features.

2. Security: Never commit your .env file to GitHub. It is already included in .gitignore. Use .env.example as a template for new team members.

3. Connection Issues: If you cannot connect, double-check that your current IP address is whitelisted in the MongoDB Atlas dashboard.
