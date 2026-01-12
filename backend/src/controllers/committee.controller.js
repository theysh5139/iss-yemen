import { Committee } from '../models/Committee.model.js';

// Get all Committees (public endpoint)
export async function getCommittees(req, res, next) {
  try {
    const committees = await Committee.find()
      .sort({ priority: 1, name: 1 })
      .lean();
    return res.json({ committees });
  } catch (err) {
    next(err);
  }
}

// Get single Committee by ID
export async function getCommitteeById(req, res, next) {
  try {
    const { id } = req.params;
    const committee = await Committee.findById(id).lean();
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }
    return res.json({ committee });
  } catch (err) {
    next(err);
  }
}

// Create Committee (admin only)
export async function createCommittee(req, res, next) {
  try {
    const { name, priority } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Committee name is required' });
    }

    const committee = await Committee.create({
      name: name.trim(),
      priority: priority !== undefined && priority !== null ? priority : null
    });

    return res.status(201).json({ message: 'Committee created successfully', committee });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Committee with this name already exists' });
    }
    next(err);
  }
}

// Update Committee (admin only)
export async function updateCommittee(req, res, next) {
  try {
    const { id } = req.params;
    const { name, priority } = req.body;

    const committee = await Committee.findById(id);
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Committee name cannot be empty' });
      }
      committee.name = name.trim();
    }
    if (priority !== undefined) {
      committee.priority = priority !== null ? priority : null;
    }

    await committee.save();
    
    return res.json({ message: 'Committee updated successfully', committee });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Committee with this name already exists' });
    }
    next(err);
  }
}

// Delete Committee (admin only)
export async function deleteCommittee(req, res, next) {
  try {
    const { id } = req.params;
    const committee = await Committee.findById(id);
    if (!committee) {
      return res.status(404).json({ message: 'Committee not found' });
    }
    
    await Committee.findByIdAndDelete(id);
    
    return res.json({ message: 'Committee deleted successfully' });
  } catch (err) {
    next(err);
  }
}
