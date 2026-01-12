import { ExecutiveCommitteeMember } from '../models/ExecutiveCommitteeMember.model.js';
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

// Get all Executive Committee Members (public endpoint)
export async function getExecutiveMembers(req, res, next) {
  try {
    const members = await ExecutiveCommitteeMember.find()
      .sort({ role: 1, name: 1 })
      .lean();
    return res.json({ members });
  } catch (err) {
    next(err);
  }
}

// Get single Executive Member by ID
export async function getExecutiveMemberById(req, res, next) {
  try {
    const { id } = req.params;
    const member = await ExecutiveCommitteeMember.findById(id)
      .lean();
    if (!member) {
      return res.status(404).json({ message: 'Executive member not found' });
    }
    return res.json({ member });
  } catch (err) {
    next(err);
  }
}

// Create Executive Member (admin only)
export async function createExecutiveMember(req, res, next) {
  try {
    const { name, role, email, phone, photo } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!role || !['President', 'VP', 'General Secretary', 'Treasurer'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (President, VP, General Secretary, or Treasurer)' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate photo
    const photoValidation = validatePhoto(photo);
    if (!photoValidation.valid) {
      return res.status(400).json({ message: photoValidation.message });
    }

    const member = await ExecutiveCommitteeMember.create({
      name: name.trim(),
      role,
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      photo
    });

    const populatedMember = await ExecutiveCommitteeMember.findById(member._id)
      .lean();

    return res.status(201).json({ message: 'Executive member created successfully', member: populatedMember });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Update Executive Member (admin only)
export async function updateExecutiveMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, email, phone, photo } = req.body;

    const member = await ExecutiveCommitteeMember.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Executive member not found' });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      member.name = name.trim();
    }
    if (role !== undefined) {
      if (!['President', 'VP', 'General Secretary', 'Treasurer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      member.role = role;
    }
    if (email !== undefined) {
      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }
      member.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) {
      member.phone = phone ? phone.trim() : undefined;
    }
    if (photo !== undefined) {
      const photoValidation = validatePhoto(photo);
      if (!photoValidation.valid) {
        return res.status(400).json({ message: photoValidation.message });
      }
      member.photo = photo;
    }

    await member.save();

    const populatedMember = await ExecutiveCommitteeMember.findById(member._id)
      .lean();

    return res.json({ message: 'Executive member updated successfully', member: populatedMember });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

// Delete Executive Member (admin only)
export async function deleteExecutiveMember(req, res, next) {
  try {
    const { id } = req.params;
    const member = await ExecutiveCommitteeMember.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Executive member not found' });
    }

    await ExecutiveCommitteeMember.findByIdAndDelete(id);

    return res.json({ message: 'Executive member deleted successfully' });
  } catch (err) {
    next(err);
  }
}
