import multer from 'multer';
import { uploadToGridFS } from '../utils/gridfs.js';
import fs from 'fs';
import path from 'path';

/**
 * Multer memory storage for GridFS uploads
 * Files are stored in memory, then uploaded to GridFS
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, GIF, WEBP) are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Middleware to upload image to GridFS after multer processes it
 */
export const uploadImageGridFS = upload.single('image');

/**
 * Middleware to handle GridFS upload after file is received
 * This should be used after uploadImageGridFS
 */
export async function processGridFSUpload(req, res, next) {
  if (!req.file) {
    return next(); // No file to process
  }

  try {
    // Upload to GridFS
    const fileId = await uploadToGridFS(req.file.buffer, req.file.originalname, {
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Store file ID in request for use in controllers
    req.file.gridfsId = fileId;
    req.file.gridfsUrl = `/api/images/gridfs/${fileId}`;
    
    next();
  } catch (error) {
    console.error('[GridFS Upload Error]:', error);
    return res.status(500).json({ 
      message: 'Failed to upload image to database',
      error: error.message 
    });
  }
}


