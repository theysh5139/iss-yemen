import { downloadFromGridFS, getFileMetadata, deleteFromGridFS } from '../utils/gridfs.js';
import mongoose from 'mongoose';

/**
 * Serve image from GridFS
 */
export async function getImage(req, res, next) {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const fileMetadata = await getFileMetadata(fileId);
    const fileBuffer = await downloadFromGridFS(fileId);

    // Set appropriate content type
    res.setHeader('Content-Type', fileMetadata.metadata?.mimetype || 'image/jpeg');
    res.setHeader('Content-Length', fileMetadata.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    res.send(fileBuffer);
  } catch (error) {
    if (error.message === 'File not found') {
      return res.status(404).json({ message: 'Image not found' });
    }
    console.error('[Get Image Error]:', error);
    next(error);
  }
}

/**
 * Delete image from GridFS
 */
export async function deleteImage(req, res, next) {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    await deleteFromGridFS(fileId);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[Delete Image Error]:', error);
    next(error);
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(req, res, next) {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const metadata = await getFileMetadata(fileId);
    res.json({
      id: metadata._id,
      filename: metadata.filename,
      length: metadata.length,
      uploadDate: metadata.uploadDate,
      metadata: metadata.metadata
    });
  } catch (error) {
    if (error.message === 'File not found') {
      return res.status(404).json({ message: 'Image not found' });
    }
    next(error);
  }
}


