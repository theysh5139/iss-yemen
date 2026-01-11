# MongoDB GridFS Image Storage Setup

This guide explains how to use MongoDB GridFS to store images directly in your MongoDB database, making them accessible from cloud MongoDB instances.

## Overview

The system now supports **two storage methods**:

1. **Filesystem Storage** (Default) - Images stored on server filesystem
2. **GridFS Storage** - Images stored directly in MongoDB

## Benefits of GridFS

✅ **Cloud-Ready**: Images stored in MongoDB are accessible from any server instance  
✅ **No File System Dependencies**: Works with serverless/container deployments  
✅ **Automatic Backups**: Images included in MongoDB backups  
✅ **Scalable**: MongoDB handles large files efficiently  
✅ **Centralized**: All data (including images) in one database  

## Setup Instructions

### 1. Install MongoDB Driver (if not already installed)

The `mongodb` package should be available through `mongoose`, but if you encounter issues, you can install it:

```bash
cd backend
npm install mongodb
```

### 2. Enable GridFS in Environment Variables

Add to your `backend/.env` file:

```env
# Use GridFS for image storage (set to 'true' to enable)
USE_GRIDFS=true

# Optional: Custom bucket name (default: 'images')
GRIDFS_BUCKET_NAME=images
```

### 3. Restart Your Server

After enabling GridFS, restart your backend server:

```bash
npm run dev
```

## How It Works

### When GridFS is Enabled:

1. **Upload**: Images are uploaded to MongoDB GridFS
   - Images are stored in the `images.files` and `images.chunks` collections
   - File ID is stored in the Event/Announcement document

2. **Access**: Images are served via API endpoint
   - URL format: `/api/images/gridfs/{fileId}`
   - Example: `http://localhost:5000/api/images/gridfs/507f1f77bcf86cd799439011`

3. **Storage**: Images are stored in MongoDB collections:
   - `images.files` - File metadata
   - `images.chunks` - File data chunks

### When GridFS is Disabled (Default):

- Images are stored in `backend/src/uploads/images/`
- URLs: `/uploads/images/{filename}`
- Works for local development

## API Endpoints

### Get Image
```
GET /api/images/gridfs/:fileId
```
Returns the image file with proper content-type headers.

### Get Image Metadata
```
GET /api/images/gridfs/:fileId/metadata
```
Returns image metadata (filename, size, upload date, etc.).

### Delete Image (Admin Only)
```
DELETE /api/images/gridfs/:fileId
```
Deletes an image from GridFS.

## Migration from Filesystem to GridFS

If you have existing images in the filesystem and want to migrate to GridFS:

1. Enable GridFS in `.env`
2. Upload new images - they will automatically use GridFS
3. Old images will continue to work from filesystem
4. Optionally, create a migration script to move existing images to GridFS

## Frontend Usage

The frontend doesn't need any changes! The image URLs returned from the API will automatically point to the correct location:

- **GridFS**: `/api/images/gridfs/{fileId}`
- **Filesystem**: `/uploads/images/{filename}`

Both URLs are handled automatically by the backend.

## Troubleshooting

### Images Not Showing

1. **Check MongoDB Connection**: Ensure MongoDB is connected
   ```bash
   GET http://localhost:5000/api/health/db
   ```

2. **Check Environment Variable**: Verify `USE_GRIDFS=true` in `.env`

3. **Check Server Logs**: Look for GridFS upload errors in console

4. **Verify File ID**: Ensure the fileId in the URL is a valid MongoDB ObjectId

### GridFS Not Working

1. **MongoDB Version**: Ensure MongoDB 3.4+ (GridFS is built-in)

2. **Connection**: GridFS requires an active MongoDB connection

3. **Permissions**: Ensure MongoDB user has read/write permissions

## Production Recommendations

For production, consider:

1. **CDN**: Use a CDN (CloudFront, Cloudflare) in front of image endpoints
2. **Caching**: Images are cached for 1 year (configurable in `image.controller.js`)
3. **Compression**: Compress images before upload
4. **Monitoring**: Monitor GridFS bucket size and performance

## Alternative: Cloud Storage Services

For very high traffic or large files, consider:
- **AWS S3** + CloudFront
- **Google Cloud Storage**
- **Cloudinary** (image optimization included)
- **Azure Blob Storage**

These services offer better performance and CDN integration but require additional setup.


