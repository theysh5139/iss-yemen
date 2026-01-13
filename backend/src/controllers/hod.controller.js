import { HOD } from '../models/HOD.model.js';

// Get all HODs (public endpoint)
export async function getHODs(req, res, next) {
  try {
    const hods = await HOD.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();
    
    // Ensure consistent response format
    return res.json({ 
      hods: hods || [],
      count: hods?.length || 0
    });
  } catch (err) {
    next(err);
  }
}

// Get single HOD by ID
export async function getHODById(req, res, next) {
  try {
    const { id } = req.params;
    const hod = await HOD.findById(id).lean();
    if (!hod) {
      return res.status(404).json({ message: 'HOD not found' });
    }
    return res.json({ hod });
  } catch (err) {
    next(err);
  }
}

// Create HOD (admin only)
export async function createHOD(req, res, next) {
  try {
    const { name, designation, photo, order } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ message: 'Designation is required' });
    }
    if (!photo || typeof photo !== 'string') {
      return res.status(400).json({ message: 'Valid photo URL/path or uploaded image is required' });
    }

    // Check if it's a base64 data URL
    const isBase64 = photo.startsWith('data:image/');
    if (isBase64) {
      // Validate base64 data URL format
      const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
      if (!base64Pattern.test(photo)) {
        return res.status(400).json({ message: 'Invalid image format. Supported: jpg, jpeg, png, gif, webp' });
      }
    } else {
      // Validate regular URL/path
      const urlPattern = /^(https?:\/\/|\.|\/)/;
      if (!urlPattern.test(photo)) {
        return res.status(400).json({ message: 'Photo must be a valid URL or path' });
      }

      // Validate image extension for URLs
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
      if (!imageExtensions.test(photo)) {
        return res.status(400).json({ message: 'Photo must be a valid image file (jpg, jpeg, png, gif, webp)' });
      }
    }

    const hod = await HOD.create({
      name: name.trim(),
      designation: designation.trim(),
      photo,
      order: order !== undefined ? parseInt(order) || 0 : 0
    });

    // Broadcast real-time update
    try {
      const { broadcastHODUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastHODUpdate(hod, 'created');
      broadcastDataRefresh('hods');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    return res.status(201).json({ message: 'HOD created successfully', hod });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Update HOD (admin only)
export async function updateHOD(req, res, next) {
  try {
    const { id } = req.params;
    const { name, designation, photo, order } = req.body;

    const hod = await HOD.findById(id);
    if (!hod) {
      return res.status(404).json({ message: 'HOD not found' });
    }

    // Validate photo if provided
    if (photo !== undefined) {
      if (!photo || typeof photo !== 'string') {
        return res.status(400).json({ message: 'Valid photo URL/path or uploaded image is required' });
      }

      // Check if it's a base64 data URL
      const isBase64 = photo.startsWith('data:image/');
      if (isBase64) {
        // Validate base64 data URL format
        const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
        if (!base64Pattern.test(photo)) {
          return res.status(400).json({ message: 'Invalid image format. Supported: jpg, jpeg, png, gif, webp' });
        }
      } else {
        // Validate regular URL/path
        const urlPattern = /^(https?:\/\/|\.|\/)/;
        if (!urlPattern.test(photo)) {
          return res.status(400).json({ message: 'Photo must be a valid URL or path' });
        }

        // Validate image extension for URLs
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (!imageExtensions.test(photo)) {
          return res.status(400).json({ message: 'Photo must be a valid image file (jpg, jpeg, png, gif, webp)' });
        }
      }
      hod.photo = photo;
    }

    if (name !== undefined) hod.name = name.trim();
    if (designation !== undefined) hod.designation = designation.trim();
    if (order !== undefined) hod.order = parseInt(order) || 0;

    await hod.save();
    
    // Broadcast real-time update
    try {
      const { broadcastHODUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastHODUpdate(hod, 'updated');
      broadcastDataRefresh('hods');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    return res.json({ message: 'HOD updated successfully', hod });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Delete HOD (admin only)
export async function deleteHOD(req, res, next) {
  try {
    const { id } = req.params;
    const hod = await HOD.findById(id);
    if (!hod) {
      return res.status(404).json({ message: 'HOD not found' });
    }
    
    await HOD.findByIdAndDelete(id);
    
    // Broadcast real-time update
    try {
      const { broadcastHODUpdate, broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastHODUpdate(hod, 'deleted');
      broadcastDataRefresh('hods');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    return res.json({ message: 'HOD deleted successfully' });
  } catch (err) {
    next(err);
  }
}

