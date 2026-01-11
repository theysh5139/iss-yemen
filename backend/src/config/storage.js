/**
 * Storage configuration
 * Set USE_GRIDFS=true in .env to use MongoDB GridFS for image storage
 * Otherwise, uses filesystem storage
 */
export const STORAGE_CONFIG = {
  useGridFS: process.env.USE_GRIDFS === 'true' || process.env.USE_GRIDFS === '1',
  gridFSBucketName: process.env.GRIDFS_BUCKET_NAME || 'images'
};

export function getImageUrl(file) {
  if (!file) return undefined;
  
  // If GridFS is enabled and file has gridfsId, use GridFS URL
  if (STORAGE_CONFIG.useGridFS && file.gridfsId) {
    return file.gridfsUrl || `/api/images/gridfs/${file.gridfsId}`;
  }
  
  // Otherwise, use filesystem URL
  return `/uploads/images/${file.filename}`;
}


