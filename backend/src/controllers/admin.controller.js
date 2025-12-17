import { User } from '../models/User.model.js';
import { Event } from '../models/Event.model.js';

export async function getAdminStats(req, res, next) {
  try {
    const [totalUsers, totalEvents, activeAnnouncements] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ type: 'event' }),
      Event.countDocuments({ type: 'announcement', date: { $gte: new Date() } })
    ]);

    // For now, views is a placeholder - you can implement actual view tracking later
    const views = 7265; // This would come from analytics in production

    return res.json({
      views,
      totalUsers,
      totalEvents,
      activeAnnouncements
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-passwordHash -emailVerificationTokenHash -passwordResetTokenHash')
      .sort({ createdAt: -1 })
      .lean();

    // Add emailVerified field for frontend
    const usersWithVerified = users.map(u => ({
      ...u,
      emailVerified: Boolean(u.emailVerifiedAt)
    }));

    return res.json({ users: usersWithVerified });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['visitor', 'member', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(id);

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Add isActive field or use a status field
    // For now, we'll change role to visitor as a form of deactivation
    // In production, you'd add an isActive boolean field
    user.role = 'visitor';
    await user.save();

    return res.json({
      message: 'User deactivated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
}

// Announcement Management
export async function createAnnouncement(req, res, next) {
  try {
    const { title, description, date, location, category, isPublic } = req.body;

    const announcement = await Event.create({
      title,
      description,
      date: date || new Date(),
      location: location || 'TBA',
      category: category || 'Announcement',
      type: 'announcement',
      isPublic: isPublic !== undefined ? isPublic : true
    });

    return res.status(201).json({
      message: 'Announcement created successfully',
      event: announcement
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, date, location, category, isPublic } = req.body;

    const announcement = await Event.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.type !== 'announcement') {
      return res.status(400).json({ message: 'This is not an announcement' });
    }

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (date) announcement.date = date;
    if (location) announcement.location = location;
    if (category) announcement.category = category;
    if (isPublic !== undefined) announcement.isPublic = isPublic;

    await announcement.save();

    return res.json({
      message: 'Announcement updated successfully',
      event: announcement
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;

    const announcement = await Event.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (announcement.type !== 'announcement') {
      return res.status(400).json({ message: 'This is not an announcement' });
    }

    await Event.findByIdAndDelete(id);

    return res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// Event Management
export async function createEvent(req, res, next) {
  try {
    const { title, description, date, location, category, type, schedule, isRecurring, isPublic } = req.body;

    if (!title || !description || !date || !location || !category) {
      return res.status(400).json({ message: 'Title, description, date, location, and category are required' });
    }

    const event = await Event.create({
      title,
      description,
      date: date ? new Date(date) : new Date(),
      location,
      category,
      type: type || 'event',
      schedule: schedule || undefined,
      isRecurring: isRecurring || false,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    return res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, date, location, category, type, schedule, isRecurring, isPublic, cancelled } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (category) event.category = category;
    if (type) event.type = type;
    if (schedule !== undefined) event.schedule = schedule;
    if (isRecurring !== undefined) event.isRecurring = isRecurring;
    if (isPublic !== undefined) event.isPublic = isPublic;
    if (cancelled !== undefined) {
      // Add cancelled field to event model or use a status field
      // For now, we'll add it to the event object
      event.cancelled = cancelled;
    }

    await event.save();

    return res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelEvent(req, res, next) {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.cancelled = true;
    await event.save();

    return res.json({
      message: 'Event cancelled successfully',
      event
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(id);

    return res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getAllAnnouncements(req, res, next) {
  try {
    const announcements = await Event.find({ type: 'announcement' })
      .sort({ date: -1 })
      .lean();

    return res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

export async function getAllEvents(req, res, next) {
  try {
    // Get all events and activities (not announcements)
    const events = await Event.find({ 
      $or: [{ type: 'event' }, { type: 'activity' }]
    })
      .sort({ date: -1 })
      .populate('registeredUsers', 'name email')
      .lean();

    return res.json({ events });
  } catch (err) {
    next(err);
  }
}

