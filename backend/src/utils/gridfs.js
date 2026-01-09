import mongoose from 'mongoose';
import { Readable } from 'stream';

let gridFSBucket = null;
let GridFSBucketClass = null;

/**
 * Lazy load GridFSBucket from mongodb package
 */
async function getGridFSBucket() {
  if (!GridFSBucketClass) {
    try {
      const mongodb = await import('mongodb');
      GridFSBucketClass = mongodb.GridFSBucket;
    } catch (error) {
      throw new Error('GridFSBucket not available. Please install mongodb package: npm install mongodb');
    }
  }
  return GridFSBucketClass;
}

/**
 * Initialize GridFS bucket for file storage
 */
export async function initGridFS() {
  if (!gridFSBucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established. Please ensure database is connected.');
    }
    const GridFSBucket = await getGridFSBucket();
    gridFSBucket = new GridFSBucket(db, { bucketName: 'images' });
  }
  return gridFSBucket;
}

/**
 * Upload file to GridFS
 * @param {Buffer|Readable} fileBuffer - File buffer or stream
 * @param {string} filename - Original filename
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<string>} - File ID
 */
export async function uploadToGridFS(fileBuffer, filename, metadata = {}) {
  const bucket = await initGridFS();
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadedAt: new Date()
      }
    });

    const readable = Buffer.isBuffer(fileBuffer) 
      ? Readable.from(fileBuffer) 
      : fileBuffer;

    readable.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });
  });
}

/**
 * Download file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Buffer>} - File buffer
 */
export async function downloadFromGridFS(fileId) {
  const bucket = await initGridFS();
  
  return new Promise((resolve, reject) => {
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', (error) => {
      reject(error);
    });

    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Get file metadata from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Object>} - File metadata
 */
export async function getFileMetadata(fileId) {
  const bucket = await initGridFS();
  const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
  
  if (files.length === 0) {
    throw new Error('File not found');
  }
  
  return files[0];
}

/**
 * Delete file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
export async function deleteFromGridFS(fileId) {
  const bucket = await initGridFS();
  await bucket.delete(new mongoose.Types.ObjectId(fileId));
}

/**
 * Check if file exists in GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<boolean>}
 */
export async function fileExistsInGridFS(fileId) {
  try {
    const bucket = await initGridFS();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    return files.length > 0;
  } catch (error) {
    return false;
  }
}

