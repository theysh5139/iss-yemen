import { CommitteeHead } from '../models/CommitteeHead.model.js';
import { Committee } from '../models/Committee.model.js';

function validatePhoto(photo) {
  if (!photo || typeof photo !== 'string') {
    return { valid: false, message: 'Valid photo URL/path or uploaded image is required' };
  }

  const isBase64 = photo.startsWith('data:image/');
  if (isBase64) {
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!base64Pattern.test(photo)) {
      return { valid: false, message: 'Invalid image format. Supported: jpg, jpeg, png, gif, webp' };
    }
  } else {
    const urlPattern = /^(https?:\/\/|\.|\/)/;
    if (!urlPattern.test(photo)) {
      return { valid: false, message: 'Photo must be a valid URL or path' };
    }
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (!imageExtensions.test(photo)) {
      return { valid: false, message: 'Photo must be a valid image file (jpg, jpeg, png, gif, webp)' };
    }
  }
  return { valid: true };
}

// Get all Committee Heads (public endpoint)
export async function getCommitteeHeads(req, res, next) {
  try {
    const heads = await CommitteeHead.find()
      .populate('committeeId', 'name priority')
      .sort({ 'committeeId.priority': 1, name: 1 })
      .lean();
    return res.json({ heads });
  } catch (err) {
    next(err);
  }
}

// Get single Committee Head by ID
export async function getCommitteeHeadById(req, res, next) {
  try {
    const { id } = req.params;
    const head = await CommitteeHead.findById(id)
      .populate('committeeId', 'name priority')
      .lean();
    if (!head) {
      return res.status(404).json({ message: 'Committee head not found' });
    }
    return res.json({ head });
  } catch (err) {
    next(err);
  }
}

// Get Committee Heads by Committee ID
export async function getCommitteeHeadsByCommittee(req, res, next) {
  try {
    const { committeeId } = req.params;
    const heads = await CommitteeHead.find({ committeeId })
      .populate('committeeId', 'name priority')
      .lean();
    return res.json({ heads });
  } catch (err) {
    next(err);
  }
}

// Create Committee Head (admin only)
export async function createCommitteeHead(req, res, next) {
  try {
    const { name, committeeId, committee, email, phone, photo } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    // Allow frontend to send either `committeeId` (ObjectId) or `committee` (string name).
    let resolvedCommitteeId = committeeId;
    if (!resolvedCommitteeId && committee && typeof committee === 'string') {
      // Find existing committee by name (case-insensitive)
      const existing = await Committee.findOne({ name: { $regex: `^${committee.trim()}$`, $options: 'i' } });
      if (existing) {
        resolvedCommitteeId = existing._id;
      } else {
        // Create new committee when not found
        const newCommittee = await Committee.create({ name: committee.trim() });
        resolvedCommitteeId = newCommittee._id;
      }
    }
    if (!resolvedCommitteeId) {
      return res.status(400).json({ message: 'Committee is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Verify committee exists
    const committeeObj = await Committee.findById(resolvedCommitteeId);
    if (!committeeObj) {
      return res.status(400).json({ message: 'Committee not found' });
    }

    // Validate photo
    const photoValidation = validatePhoto(photo);
    if (!photoValidation.valid) {
      return res.status(400).json({ message: photoValidation.message });
    }

    const head = await CommitteeHead.create({
      name: name.trim(),
      committeeId: resolvedCommitteeId,
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      photo
    });

    const populatedHead = await CommitteeHead.findById(head._id)
      .populate('committeeId', 'name priority')
      .lean();

    return res.status(201).json({ message: 'Committee head created successfully', head: populatedHead });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Update Committee Head (admin only)
export async function updateCommitteeHead(req, res, next) {
  try {
    const { id } = req.params;
    const { name, committeeId, committee, email, phone, photo } = req.body;

    const head = await CommitteeHead.findById(id);
    if (!head) {
      return res.status(404).json({ message: 'Committee head not found' });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      head.name = name.trim();
    }
    if (committeeId !== undefined || committee !== undefined) {
      let resolved = committeeId;
      if (!resolved && committee && typeof committee === 'string') {
        const existing = await Committee.findOne({ name: { $regex: `^${committee.trim()}$`, $options: 'i' } });
        if (existing) resolved = existing._id;
        else {
          const newCommittee = await Committee.create({ name: committee.trim() });
          resolved = newCommittee._id;
        }
      }
      const committeeObj = await Committee.findById(resolved);
      if (!committeeObj) {
        return res.status(400).json({ message: 'Committee not found' });
      }
      head.committeeId = resolved;
    }
    if (email !== undefined) {
      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }
      head.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) {
      head.phone = phone ? phone.trim() : undefined;
    }
    if (photo !== undefined) {
      const photoValidation = validatePhoto(photo);
      if (!photoValidation.valid) {
        return res.status(400).json({ message: photoValidation.message });
      }
      head.photo = photo;
    }

    await head.save();
    
    const populatedHead = await CommitteeHead.findById(head._id)
      .populate('committeeId', 'name priority')
      .lean();
    
    return res.json({ message: 'Committee head updated successfully', head: populatedHead });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Delete Committee Head (admin only)
export async function deleteCommitteeHead(req, res, next) {
  try {
    const { id } = req.params;
    const head = await CommitteeHead.findById(id);
    if (!head) {
      return res.status(404).json({ message: 'Committee head not found' });
    }
    
    await CommitteeHead.findByIdAndDelete(id);
    
    return res.json({ message: 'Committee head deleted successfully' });
  } catch (err) {
    next(err);
  }
}
