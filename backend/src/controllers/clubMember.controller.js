import { ClubMember } from '../models/ClubMember.model.js';

// Get all club members (public endpoint)
export async function getClubMembers(req, res, next) {
  try {
    const clubMembers = await ClubMember.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return res.json({ clubMembers });
  } catch (err) {
    next(err);
  }
}

// Get single club member by ID
export async function getClubMemberById(req, res, next) {
  try {
    const { id } = req.params;
    const clubMember = await ClubMember.findById(id).lean();
    if (!clubMember) {
      return res.status(404).json({ message: 'Club member not found' });
    }
    return res.json({ clubMember });
  } catch (err) {
    next(err);
  }
}

// Create club member (admin only)
export async function createClubMember(req, res, next) {
  try {
    const { name, position, photo, order, email, bio } = req.body;

    // Validate image URL/path or base64 data URL
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

    const clubMember = await ClubMember.create({
      name,
      position,
      photo,
      order: order || 0,
      email: email || undefined,
      bio: bio || undefined
    });

    // Broadcast real-time update
    try {
      const { broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastDataRefresh('committee');
    } catch (err) {
      // Real-time not available, continue anyway
    }

    return res.status(201).json({ message: 'Club member created successfully', clubMember });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Update club member (admin only)
export async function updateClubMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, position, photo, order, email, bio, isActive } = req.body;

    const clubMember = await ClubMember.findById(id);
    if (!clubMember) {
      return res.status(404).json({ message: 'Club member not found' });
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
      clubMember.photo = photo;
    }

    if (name !== undefined) clubMember.name = name;
    if (position !== undefined) clubMember.position = position;
    if (order !== undefined) clubMember.order = order;
    if (email !== undefined) clubMember.email = email;
    if (bio !== undefined) clubMember.bio = bio;
    if (isActive !== undefined) clubMember.isActive = isActive;

    await clubMember.save();
    
    // Broadcast real-time update
    try {
      const { broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastDataRefresh('committee');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    return res.json({ message: 'Club member updated successfully', clubMember });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Delete club member (admin only)
export async function deleteClubMember(req, res, next) {
  try {
    const { id } = req.params;
    const clubMember = await ClubMember.findById(id);
    if (!clubMember) {
      return res.status(404).json({ message: 'Club member not found' });
    }
    
    await ClubMember.findByIdAndDelete(id);
    
    // Broadcast real-time update
    try {
      const { broadcastDataRefresh } = await import('../utils/realtime.js');
      broadcastDataRefresh('committee');
    } catch (err) {
      // Real-time not available, continue anyway
    }
    
    return res.json({ message: 'Club member deleted successfully' });
  } catch (err) {
    next(err);
  }
}
