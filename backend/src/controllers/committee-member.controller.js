import { CommitteeMember } from '../models/CommitteeMember.model.js';
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

// Get all Committee Members (public endpoint)
export async function getCommitteeMembers(req, res, next) {
  try {
    const members = await CommitteeMember.find()
      .populate('committeeId', 'name priority')
      .sort({ 'committeeId.priority': 1, order: 1, name: 1 })
      .lean();
    return res.json({ members });
  } catch (err) {
    next(err);
  }
}

// Get Committee Members grouped by Committee
export async function getCommitteeMembersGrouped(req, res, next) {
  try {
    const members = await CommitteeMember.find()
      .populate('committeeId', 'name priority')
      .sort({ 'committeeId.priority': 1, order: 1, name: 1 })
      .lean();
    
    // Group by committee
    const grouped = {};
    members.forEach(member => {
      const committeeId = member.committeeId._id.toString();
      if (!grouped[committeeId]) {
        grouped[committeeId] = {
          committee: member.committeeId,
          members: []
        };
      }
      grouped[committeeId].members.push(member);
    });
    
    return res.json({ grouped: Object.values(grouped) });
  } catch (err) {
    next(err);
  }
}

// Get Committee Members by Committee ID
export async function getCommitteeMembersByCommittee(req, res, next) {
  try {
    const { committeeId } = req.params;
    const members = await CommitteeMember.find({ committeeId })
      .populate('committeeId', 'name priority')
      .sort({ order: 1, name: 1 })
      .lean();
    return res.json({ members });
  } catch (err) {
    next(err);
  }
}

// Get single Committee Member by ID
export async function getCommitteeMemberById(req, res, next) {
  try {
    const { id } = req.params;
    const member = await CommitteeMember.findById(id)
      .populate('committeeId', 'name priority')
      .lean();
    if (!member) {
      return res.status(404).json({ message: 'Committee member not found' });
    }
    return res.json({ member });
  } catch (err) {
    next(err);
  }
}

// Create Committee Member (admin only)
export async function createCommitteeMember(req, res, next) {
  try {
    const { name, committeeId, photo, order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!committeeId) {
      return res.status(400).json({ message: 'Committee is required' });
    }

    // Verify committee exists
    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(400).json({ message: 'Committee not found' });
    }

    // Validate photo
    const photoValidation = validatePhoto(photo);
    if (!photoValidation.valid) {
      return res.status(400).json({ message: photoValidation.message });
    }

    const member = await CommitteeMember.create({
      name: name.trim(),
      committeeId,
      photo,
      order: order !== undefined ? order : 0
    });

    const populatedMember = await CommitteeMember.findById(member._id)
      .populate('committeeId', 'name priority')
      .lean();

    return res.status(201).json({ message: 'Committee member created successfully', member: populatedMember });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Update Committee Member (admin only)
export async function updateCommitteeMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, committeeId, photo, order } = req.body;

    const member = await CommitteeMember.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Committee member not found' });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      member.name = name.trim();
    }
    if (committeeId !== undefined) {
      const committee = await Committee.findById(committeeId);
      if (!committee) {
        return res.status(400).json({ message: 'Committee not found' });
      }
      member.committeeId = committeeId;
    }
    if (photo !== undefined) {
      const photoValidation = validatePhoto(photo);
      if (!photoValidation.valid) {
        return res.status(400).json({ message: photoValidation.message });
      }
      member.photo = photo;
    }
    if (order !== undefined) {
      member.order = order;
    }

    await member.save();
    
    const populatedMember = await CommitteeMember.findById(member._id)
      .populate('committeeId', 'name priority')
      .lean();
    
    return res.json({ message: 'Committee member updated successfully', member: populatedMember });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Delete Committee Member (admin only)
export async function deleteCommitteeMember(req, res, next) {
  try {
    const { id } = req.params;
    const member = await CommitteeMember.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Committee member not found' });
    }
    
    await CommitteeMember.findByIdAndDelete(id);
    
    return res.json({ message: 'Committee member deleted successfully' });
  } catch (err) {
    next(err);
  }
}
